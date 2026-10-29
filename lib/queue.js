import { Queue } from "bullmq";
import IORedis from "ioredis";

// 1. Inisialisasi Koneksi Redis
const redisConnection = new IORedis(
  process.env.REDIS_URL || "redis://127.0.0.1:6379",
  {
    maxRetriesPerRequest: null, // Wajib null untuk kompatibilitas BullMQ
    enableReadyCheck: false,
  },
);

// 2. Buat Antrean 'notificationQueue' dengan Kebijakan Retry
export const notificationQueue = new Queue("notificationQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Coba ulang 3x jika gagal
    backoff: {
      type: "exponential",
      delay: 2000, // Jeda retry bertingkat (2s, 4s, 8s)
    },
    removeOnComplete: {
      age: 3600, // Simpan histori sukses 1 jam
      count: 1000,
    },
    removeOnFail: {
      age: 24 * 3600, // Simpan histori gagal 24 jam untuk audit
    },
  },
});

// 3. Helper Pengirim Antrean dengan Error Handling (Non-Blocking)
export async function sendPushNotificationJob(data) {
  try {
    const job = await notificationQueue.add("send-web-push", data, {
      priority: data.priority || 2,
    });
    console.log(
      `📥 [QUEUE] Notifikasi masuk antrean: Job ID ${job.id} (User: ${data.userId})`,
    );
    return { success: true, jobId: job.id };
  } catch (error) {
    // Transaksi utama di database tetap jalan meski antrean bermasalah
    console.error(
      "⚠️ [QUEUE WARNING] Gagal memasukkan job ke antrean Redis:",
      error.message,
    );
    return { success: false, error: error.message };
  }
}
