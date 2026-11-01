import { sendPushNotificationJob } from "@/lib/queue";

export type PayloadPush = {
  title: string;
  body: string;
  /** Halaman yang dibuka saat notifikasi diklik. Default: /dashboard */
  url?: string;
  /** Notifikasi dengan tag sama saling menggantikan. */
  tag?: string;
  /** BullMQ: angka lebih kecil = lebih diprioritaskan. Default: 2 */
  priority?: number;
};

const BATAS_WAKTU_MS = 3000;

/**
 * Masukkan notifikasi untuk satu pengguna ke antrean (dikirim oleh worker).
 * Tidak pernah melempar error dan tidak menggantung lebih dari 3 detik,
 * sehingga transaksi utama (reservasi, pembatalan) tidak terganggu bila Redis bermasalah.
 */
export async function kirimNotifikasi(userId: string, payload: PayloadPush) {
  try {
    return await Promise.race([
      sendPushNotificationJob({ userId, url: "/dashboard", priority: 2, ...payload }),
      new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: "Antrean tidak merespons (timeout)." }), BATAS_WAKTU_MS)
      ),
    ]);
  } catch (error) {
    console.error("kirimNotifikasi gagal:", error);
    return { success: false, error: "Gagal memasukkan notifikasi ke antrean." };
  }
}

/**
 * Teks notifikasi siap pakai saat STATUS reservasi berubah.
 * Dipakai di sisi staf/admin, contoh:
 *   after(() => kirimNotifikasi(r.userId, pesanStatusReservasi("DIKONFIRMASI", r.id, "Sen, 2 Nov 2026", r.jamMulai)));
 */
export function pesanStatusReservasi(
  status: "DIKONFIRMASI" | "SELESAI" | "DIBATALKAN",
  reservasiId: string,
  tanggalTeks: string,
  jamMulai: string
): PayloadPush {
  const tag = `reservasi-${reservasiId}`;
  switch (status) {
    case "DIKONFIRMASI":
      return { title: "Reservasi dikonfirmasi", body: `Meja Anda siap pada ${tanggalTeks} pukul ${jamMulai}. Sampai jumpa!`, tag };
    case "SELESAI":
      return { title: "Terima kasih telah berkunjung", body: `Reservasi ${tanggalTeks} telah selesai.`, tag };
    case "DIBATALKAN":
      return { title: "Reservasi dibatalkan", body: `Reservasi ${tanggalTeks} pukul ${jamMulai} dibatalkan.`, tag };
  }
}