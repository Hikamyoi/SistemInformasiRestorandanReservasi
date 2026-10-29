import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signJWT, setAuthCookie } from "@/lib/auth";

const registerSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").max(150),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  noHp: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = registerSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, errors: validatedData.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { nama, email, password, noHp } = validatedData.data;

    // Cek apakah email sudah terdaftar
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar!" },
        { status: 409 },
      );
    }

    // Hash Password dengan bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Simpan ke database PostgreSQL (role default: PELANGGAN)
    const newUser = await prisma.user.create({
      data: {
        nama,
        email: email.toLowerCase(),
        passwordHash,
        noHp: noHp || null,
        role: "PELANGGAN",
      },
    });

    // Buat JWT & pasang session cookie
    const token = await signJWT({
      userId: newUser.id,
      email: newUser.email,
      nama: newUser.nama,
      role: newUser.role,
    });

    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: "Registrasi berhasil!",
        user: {
          id: newUser.id,
          nama: newUser.nama,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error Register:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
