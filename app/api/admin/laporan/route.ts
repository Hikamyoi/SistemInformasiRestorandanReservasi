// app/api/admin/laporan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD

    const whereClause: any = {
      statusPembayaran: "LUNAS",
      statusReservasi: { not: "DIBATALKAN" },
    };

    if (startDate || endDate) {
      whereClause.tanggal = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { success: false, error: "Format startDate tidak valid." },
            { status: 400 },
          );
        }
        whereClause.tanggal.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { success: false, error: "Format endDate tidak valid." },
            { status: 400 },
          );
        }
        whereClause.tanggal.lte = end;
      }
    }

    const transaksi = await prisma.reservasi.findMany({
      where: whereClause,
      orderBy: [
        { tanggal: "desc" },
        { jamMulai: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        meja: {
          select: {
            id: true,
            nomorMeja: true,
            ruangan: true,
            viewMeja: true,
          },
        },
        detailMenu: {
          include: {
            menu: {
              select: {
                id: true,
                namaMenu: true,
                harga: true,
              },
            },
          },
        },
      },
    });

    const totalTransaksi = transaksi.length;
    const totalPendapatan = transaksi.reduce(
      (sum, item) => sum + Number(item.totalBayar || 0),
      0,
    );
    const totalTamu = transaksi.reduce(
      (sum, item) => sum + Number(item.jumlahTamu || 0),
      0,
    );
    const rataRataTransaksi =
      totalTransaksi > 0 ? Math.round(totalPendapatan / totalTransaksi) : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalTransaksi,
          totalPendapatan,
          totalTamu,
          rataRataTransaksi,
        },
        transaksi,
      },
    });
  } catch (error: any) {
    console.error("Error GET /api/admin/laporan:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memuat laporan transaksi POS.",
      },
      { status: 500 },
    );
  }
}
