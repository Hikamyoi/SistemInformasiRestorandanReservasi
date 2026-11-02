"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function prosesPembayaranKasir({
    reservasiId,
    metodePembayaran,
}: {
    reservasiId: string;
    metodePembayaran: string;
}) {
    try {
    await prisma.reservasi.update({
        where: { id: reservasiId },
        data: {
        statusPembayaran: "LUNAS",
        statusReservasi: "SELESAI",
        },
    });

    revalidatePath("/staff/cashier");
    revalidatePath("/staff/dashboard");
    return { success: true };
    } catch (error) {
    console.error("Gagal memproses pembayaran:", error);
    return { success: false, error: "Gagal memproses transaksi kasir." };
    }
}