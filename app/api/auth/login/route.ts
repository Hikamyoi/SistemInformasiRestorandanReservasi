import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signJWT, setAuthCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { success: false, errors: validatedData.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = validatedData.data;

    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 },
      );
    }

    // Verifikasi hash password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 },
      );
    }

    // Generate JWT & pasang HttpOnly Cookie
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: "Login berhasil!",
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error Login:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server" },
      { status: 500 },
    );
  }
}
