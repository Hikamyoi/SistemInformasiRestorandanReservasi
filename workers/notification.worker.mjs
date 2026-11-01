// Worker pengirim Web Push. Dijalankan sebagai proses TERPISAH dari Next.js:
//   npm run worker
import { Worker } from "bullmq";
import IORedis from "ioredis";
import webpush from "web-push";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const { NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
  console.error("❌ [WORKER] NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, dan VAPID_SUBJECT wajib ada di .env");
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  maxRetriesPerRequest: null, // wajib untuk BullMQ
  enableReadyCheck: false,
});

async function kirimPush({ userId, title, body, url, tag }) {
  const langganan = await prisma.pushSubscription.findMany({ where: { userId } });
  if (langganan.length === 0) {
    console.log(`ℹ️  [WORKER] User ${userId} belum mengaktifkan notifikasi, dilewati.`);
    return { terkirim: 0 };
  }

  const payload = JSON.stringify({ title, body, url, tag });
  let terkirim = 0;
  const gagal = [];

  await Promise.all(
    langganan.map(async (l) => {
      try {
        await webpush.sendNotification(
          { endpoint: l.endpoint, keys: { p256dh: l.keysP256dh, auth: l.keysAuth } },
          payload,
          { TTL: 60 * 60 * 24 } // simpan maksimal 24 jam bila browser sedang offline
        );
        terkirim++;
      } catch (err) {
        // 404/410 = langganan sudah tidak berlaku (izin dicabut / browser dihapus)
        if (err.statusCode === 404 || err.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: l.id } }).catch(() => {});
          console.log(`🧹 [WORKER] Langganan kedaluwarsa dihapus (${l.id})`);
        } else {
          gagal.push(err);
        }
      }
    })
  );

  // Bila SEMUA gagal karena error sementara, lempar error agar BullMQ mencoba ulang (3x)
  if (terkirim === 0 && gagal.length > 0) {
    throw new Error(`Pengiriman gagal: ${gagal[0].message}`);
  }
  return { terkirim };
}

const worker = new Worker(
  "notificationQueue",
  async (job) => {
    if (job.name !== "send-web-push") return;
    return kirimPush(job.data);
  },
  { connection, concurrency: 5 }
);

worker.on("completed", (job, hasil) =>
  console.log(`✅ [WORKER] Job ${job.id} selesai (terkirim: ${hasil?.terkirim ?? 0})`)
);
worker.on("failed", (job, err) =>
  console.error(`⚠️ [WORKER] Job ${job?.id} gagal (percobaan ${job?.attemptsMade}): ${err.message}`)
);
worker.on("error", (err) => console.error("❌ [WORKER] Error:", err.message));

console.log("🚀 [WORKER] Menunggu job di antrean 'notificationQueue'…");

async function matikan() {
  await worker.close();
  await prisma.$disconnect();
  await connection.quit();
  process.exit(0);
}
process.on("SIGINT", matikan);
process.on("SIGTERM", matikan);