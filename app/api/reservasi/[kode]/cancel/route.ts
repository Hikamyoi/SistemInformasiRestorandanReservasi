import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusReservasi } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { kode } = resolvedParams;
    // ... (sisa kode ke bawah tetap sama)

    if (!kode) {
      return NextResponse.json(
        { success: false, error: "Kode booking wajib dicantumkan." },
        { status: 400 },
      );
    }

    // 1. Cari reservasi
    const reservasi = await prisma.reservasi.findUnique({
      where: { kodeBooking: kode },
      include: { meja: true },
    });

    if (!reservasi) {
      return NextResponse.json(
        {
          success: false,
          error: `Reservasi dengan kode "${kode}" tidak ditemukan.`,
        },
        { status: 404 },
      );
    }

    // 2. ATURAN TAHAP 2 (NO-CANCEL):
    // Tolak dengan HTTP 403 jika statusPembayaran sudah LUNAS!
    if (reservasi.statusPembayaran === "LUNAS") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kebijakan Restoran: Reservasi yang sudah berstatus LUNAS tidak dapat dibatalkan.",
          kodeBooking: reservasi.kodeBooking,
          statusPembayaran: reservasi.statusPembayaran,
        },
        { status: 403 },
      );
    }

    // 3. Cek jika sudah pernah dibatalkan
    if (reservasi.statusReservasi === StatusReservasi.DIBATALKAN) {
      return NextResponse.json(
        { success: false, error: "Reservasi ini sudah berstatus DIBATALKAN." },
        { status: 400 },
      );
    }

    // 4. Jika belum lunas, izinkan pembatalan
    const reservasiBatal = await prisma.reservasi.update({
      where: { kodeBooking: kode },
      data: {
        statusReservasi: StatusReservasi.DIBATALKAN,
        statusPembayaran: "DIBATALKAN",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reservasi ${kode} berhasil dibatalkan.`,
      data: reservasiBatal,
    });
  } catch (error: any) {
    console.error("Error PATCH cancel:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memproses pembatalan." },
      { status: 500 },
    );
  }
}
