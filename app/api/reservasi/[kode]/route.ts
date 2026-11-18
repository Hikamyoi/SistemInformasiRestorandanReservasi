// app/api/reservasi/[kode]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { kode } = resolvedParams;

    if (!kode) {
      return NextResponse.json(
        { success: false, error: "Kode booking wajib dicantumkan." },
        { status: 400 },
      );
    }

    const reservasi = await prisma.reservasi.findUnique({
      where: { kodeBooking: kode },
      include: {
        meja: true,
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            noHp: true,
          },
        },
        detailMenu: {
          include: {
            menu: {
              select: {
                id: true,
                namaMenu: true,
                harga: true,
                fotoUrl: true,
              },
            },
          },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: reservasi,
    });
  } catch (error: any) {
    console.error("Error GET /api/reservasi/[kode]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data reservasi.",
      },
      { status: 500 },
    );
  }
}
