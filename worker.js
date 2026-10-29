// worker.js (Background Worker Terpisah)
// Jalankan mandiri di terminal dengan: node worker.js
require("dotenv").config();
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const webpush = require("web-push");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// 1. Konfigurasi Kredensial VAPID untuk Web Push (65 bytes valid)
const VAPID_SUBJECT = (
  process.env.VAPID_SUBJECT || "mailto:admin@resto.com"
).trim();

const VAPID_PUBLIC_KEY = (
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BMJNYN86H_bWbNg1DeUUeyN9KhvMkavfi6z1ORnMxtLEHk9H7qIVolMf58D0Sy9w-K7_5ZN0IEYuPQ9OTGxQ70U"
).trim();

const VAPID_PRIVATE_KEY = (
  process.env.VAPID_PRIVATE_KEY || "NT-uorcTlbTUiWH4hUeRADZrgUv3Tj43hSj4rPz6pt8"
).trim();

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log(
    "🔑 [VAPID READY] Kredensial Web Push VAPID berhasil dikonfigurasi.",
  );
} catch (vapidErr) {
  console.error("⚠️ [VAPID ERROR] Kunci VAPID tidak valid:", vapidErr.message);
}

// 2. Koneksi Redis untuk Worker
const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null, // Wajib null untuk BullMQ
    retryStrategy(times) {
      // Tunggu maksimal 3 detik sebelum coba hubungkan ulang ke Redis
      return Math.min(times * 500, 3000);
    },
  },
);

redisConnection.on("connect", () => {
  console.log("📡 [REDIS] Terhubung ke Redis server.");
});

redisConnection.on("error", (err) => {
  // Hanya log peringatan jika Redis belum nyala di lokal, tanpa crash
  console.warn(
    "⚠️ [REDIS OFFLINE] Menunggu Redis server menyala...",
    err.message,
  );
});

console.log(
  "🚀 [WORKER INIT] Background Worker Notification siap memproses antrean...",
);

// 3. Worker Pemroses Job Antrean
const worker = new Worker(
  "notificationQueue",
  async (job) => {
    const { userId, title, message, url, data } = job.data;
    console.log(
      `\n⚙️ [JOB PROCESSING] Memproses Job ID ${job.id} (Percobaan ke-${job.attemptsMade + 1}/${job.opts.attempts})`,
    );

    if (!userId) {
      throw new Error("Field userId wajib disertakan dalam payload antrean!");
    }

    // A. Ambil token PushSubscription milik user dari PostgreSQL via Prisma
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (!subscriptions || subscriptions.length === 0) {
      console.log(
        `ℹ️ [PUSH INFO] User ID ${userId} belum mengaktifkan izin notifikasi di browser. Job selesai.`,
      );
      return { skipped: true, reason: "No subscriptions found" };
    }

    console.log(
      `📱 [PUSH FOUND] Ditemukan ${subscriptions.length} perangkat terdaftar untuk User: ${userId}`,
    );

    // B. Susun Payload Notifikasi Web Push
    const payload = JSON.stringify({
      title: title || "RestoReserve Update 🍽️",
      body: message || "Ada pembaruan status reservasi meja Anda!",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      url: url || "/reservasi",
      data: {
        timestamp: Date.now(),
        ...data,
      },
    });

    // C. Kirim Notifikasi ke setiap browser/perangkat pengguna
    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keysP256dh,
          auth: sub.keysAuth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
        successCount++;
        console.log(
          `✅ [SENT] Berhasil mengirim push ke endpoint: ${sub.endpoint.slice(0, 35)}...`,
        );
      } catch (err) {
        failedCount++;
        console.error(
          `❌ [SEND FAILED] Gagal kirim: ${err.message} (HTTP ${err.statusCode})`,
        );

        // D. Auto Cleanup: Hapus token kadaluarsa (HTTP 410 Gone / 404 Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.warn(
            `🧹 [CLEANUP] Token expired (HTTP ${err.statusCode}). Menghapus dari database...`,
          );
          try {
            await prisma.pushSubscription.delete({
              where: { endpoint: sub.endpoint },
            });
            console.log(
              `🗑️ [DELETED] Token lama berhasil dibersihkan dari PostgreSQL.`,
            );
          } catch (delErr) {
            console.error("Gagal menghapus token:", delErr.message);
          }
        }
      }
    }

    return {
      userId,
      totalDevices: subscriptions.length,
      successCount,
      failedCount,
    };
  },
  {
    connection: redisConnection,
    concurrency: 5, // Mampu memproses hingga 5 job secara paralel
  },
);

// 4. Monitoring Event Worker
worker.on("completed", (job, result) => {
  console.log(`🎉 [JOB SUKSES] Job ID ${job.id} selesai diproses:`, result);
});

worker.on("failed", (job, err) => {
  console.error(
    `💥 [JOB GAGAL] Job ID ${job?.id} gagal pada percobaan ke-${job?.attemptsMade}:`,
    err.message,
  );
});

worker.on("error", (err) => {
  console.error("⚠️ [WORKER ERROR]:", err.message);
});

// 5. Penutupan Aman saat Worker Dimatikan (Ctrl + C)
process.on("SIGINT", async () => {
  console.log("\n🛑 Menutup worker dan koneksi database Prisma...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
