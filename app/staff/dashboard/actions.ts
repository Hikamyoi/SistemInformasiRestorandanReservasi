"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tipe untuk status reservasi
export type StatusReservasiType =
  | "MENUNGGU_KONFIRMASI"
  | "DIKONFIRMASI"
  | "SELESAI"
  | "DIBATALKAN";

// 1. Update status reservasi umum
export async function updateStatusReservasi(
  reservasiId: string,
  statusReservasi: StatusReservasiType
) {
  try {
    await prisma.reservasi.update({
      where: { id: reservasiId },
      data: { statusReservasi },
    });

    revalidatePath("/staff/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal update status reservasi:", error);
    return { success: false, error: "Gagal memperbarui status" };
  }
}

// 2. Ambil daftar meja restoran
export async function ambilDaftarMeja() {
  try {
    const meja = await prisma.meja.findMany({
      orderBy: { nomorMeja: "asc" },
    });
    return { success: true, data: meja };
  } catch (error) {
    console.error("Gagal mengambil data meja:", error);
    return { success: false, data: [] };
  }
}

// 3. Alokasi meja & update status (Check-in / Konfirmasi)
export async function alokasiDanCheckIn({
  reservasiId,
  mejaId,
  statusBaru,
}: {
  reservasiId: string;
  mejaId: string;
  statusBaru: StatusReservasiType;
}) {
  try {
    await prisma.reservasi.update({
      where: { id: reservasiId },
      data: {
        mejaId: mejaId,
        statusReservasi: statusBaru,
      },
    });

    revalidatePath("/staff/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Gagal alokasi meja:", error);
    return { success: false, error: "Gagal memperbarui alokasi meja" };
  }
}