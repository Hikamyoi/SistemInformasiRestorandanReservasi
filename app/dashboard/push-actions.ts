"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import type { AksiHasil } from "@/lib/validations/auth";

const langgananSchema = z.object({
  endpoint: z.string().url("Endpoint tidak valid.").max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

/** Simpan langganan push browser ini untuk pengguna yang sedang login. */
export async function simpanLangganan(input: unknown): Promise<AksiHasil> {
  try {
    const sesi = await getCurrentUser();
    if (!sesi?.userId) return { success: false, message: "Silakan masuk terlebih dahulu." };

    const hasil = langgananSchema.safeParse(input);
    if (!hasil.success) return { success: false, message: "Data langganan notifikasi tidak valid." };
    const { endpoint, keys } = hasil.data;

    // Satu endpoint = satu browser. Jika browser yang sama dipakai akun lain, langganan pindah ke akun ini.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: sesi.userId, endpoint, keysP256dh: keys.p256dh, keysAuth: keys.auth },
      update: { userId: sesi.userId, keysP256dh: keys.p256dh, keysAuth: keys.auth },
    });

    return { success: true, message: "Notifikasi diaktifkan." };
  } catch (error) {
    console.error("simpanLangganan gagal:", error);
    return { success: false, message: "Gagal menyimpan pengaturan notifikasi. Silakan coba lagi." };
  }
}

/** Hapus langganan push browser ini (hanya milik pengguna yang login). */
export async function hapusLangganan(endpoint: string): Promise<AksiHasil> {
  try {
    const sesi = await getCurrentUser();
    if (!sesi?.userId) return { success: false, message: "Silakan masuk terlebih dahulu." };

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: sesi.userId },
    });
    return { success: true, message: "Notifikasi dinonaktifkan." };
  } catch (error) {
    console.error("hapusLangganan gagal:", error);
    return { success: false, message: "Gagal menonaktifkan notifikasi. Silakan coba lagi." };
  }
}