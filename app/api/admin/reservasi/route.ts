import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.reservasi.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { nama: true, email: true, noHp: true } },
        meja: { select: { nomorMeja: true, lokasiArea: true } },
        detailMenu: {
          include: { menu: { select: { namaMenu: true } } },
        },
      },
    });

    // Konversi Decimal Prisma menjadi number biasa
    const formatted = data.map((r) => ({
      ...r,
      totalBayar: Number(r.totalBayar),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Gagal mengambil data reservasi:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat reservasi" },
      { status: 500 },
    );
  }
}
