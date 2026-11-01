"use server";

import bcrypt from "bcryptjs"; // jika login memakai "bcrypt", ganti baris ini menjadi: import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signJWT, setAuthCookie } from "@/lib/auth";
import { daftarSchema, type AksiHasil } from "@/lib/validations/auth";

export async function daftarAkun(input: unknown): Promise<AksiHasil> {
  // Validasi ulang di server (validasi klien bisa dilewati)
  const hasil = daftarSchema.safeParse(input);
  if (!hasil.success) {
    return { success: false, message: hasil.error.issues[0]?.message ?? "Data pendaftaran tidak valid." };
  }
  const d = hasil.data;

  try {
    const passwordHash = await bcrypt.hash(d.password, 10);

    // Role SELALU PELANGGAN: tidak pernah diambil dari input pengguna
    const user = await prisma.user.create({
      data: {
        nama: d.nama,
        email: d.email,
        passwordHash,
        noHp: d.noHp ? d.noHp : null,
        role: "PELANGGAN",
      },
      select: { id: true, email: true, nama: true, role: true },
    });

    // Langsung masuk setelah mendaftar
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });
    await setAuthCookie(token);

    return { success: true, message: "Akun berhasil dibuat." };
  } catch (error) {
    // P2002 = pelanggaran kolom unik (email sudah dipakai)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain." };
    }
    console.error("daftarAkun gagal:", error);
    return { success: false, message: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}