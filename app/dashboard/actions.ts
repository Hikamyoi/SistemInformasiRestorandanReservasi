"use server";

import { after } from "next/server";
import { kirimNotifikasi } from "@/lib/push";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { ReservasiActionResult } from "@/lib/validations/reservasi";

export async function batalkanReservasi(reservasiId: string): Promise<ReservasiActionResult> {
  try {
    const sesi = await getCurrentUser();
    if (!sesi?.userId) {
      return { success: false, message: "Sesi Anda berakhir. Silakan masuk kembali." };
    }

    if (typeof reservasiId !== "string" || reservasiId.length === 0) {
      return { success: false, message: "Reservasi tidak valid." };
    }

    // Satu query atomik: hanya berhasil jika reservasi MILIK pengguna ini,
    // masih aktif, dan belum dibayar. Pelanggan lain tidak bisa membatalkan punya orang.
    const hasil = await prisma.reservasi.updateMany({
      where: {
        id: reservasiId,
        userId: sesi.userId,
        statusReservasi: { in: ["MENUNGGU_KONFIRMASI", "DIKONFIRMASI"] },
        statusPembayaran: "BELUM_BAYAR",
      },
      data: {
        statusReservasi: "DIBATALKAN",
        statusPembayaran: "DIBATALKAN",
      },
    });

    if (hasil.count === 0) {
      return {
        success: false,
        message:
          "Reservasi ini tidak bisa dibatalkan. Mungkin sudah dibayar, selesai, atau sudah dibatalkan.",
      };
    }

    after(() =>
  kirimNotifikasi(sesi.userId, {
    title: "Reservasi dibatalkan",
    body: "Reservasi Anda telah dibatalkan.",
    tag: `reservasi-${reservasiId}`,
  })
);
    
    revalidatePath("/dashboard");
    return { success: true, message: "Reservasi berhasil dibatalkan." };
  } catch (error) {
    console.error("batalkanReservasi gagal:", error);
    return { success: false, message: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}