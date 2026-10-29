// test-worker.js
require("dotenv").config();
const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// 1. Hubungkan ke Redis Upstash yang sama
const redis = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});
const queue = new Queue("notificationQueue", { connection: redis });

async function kirimUjiNotifikasi() {
  console.log("📤 [PRODUCER] Mengirim job notifikasi dummy ke Redis...");

  // Kirim data job tiruan dengan format UUID yang valid
  const job = await queue.add("send-web-push", {
    userId: "a0000000-0000-0000-0000-000000000001", // Format UUID valid untuk PostgreSQL
    title: "Pesanan Meja Dikonfirmasi! 🍽️",
    message: "Halo, reservasi meja Anda untuk Tim 11 telah disetujui staf.",
    url: "/reservasi",
    data: { reservasiId: "RSV-DUMMY-99" },
  });

  console.log(
    `✅ [PRODUCER] Job berhasil masuk ke antrean Redis! ID Job: ${job.id}`,
  );

  // Tutup koneksi penguji
  await queue.close();
  await redis.quit();
}

kirimUjiNotifikasi();
