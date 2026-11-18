// app/api/admin/reservasi/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function formatTanggal(val: Date | string): string {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function formatJam(val: Date | string): string {
  if (val instanceof Date) return val.toISOString().slice(11, 16);
  const s = String(val);
  return s.includes("T") ? s.slice(11, 16) : s.slice(0, 5);
}

export async function GET() {
  try {
    const data = await prisma.reservasi.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email: true,
            noHp: true,
          },
        },
        meja: {
          select: {
            id: true,
            nomorMeja: true,
            lokasiArea: true,
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

    const formatted = data.map((r) => ({
      id: r.id,
      kodeBooking: r.kodeBooking,
      namaPemesan: r.namaPemesan,
      noHp: r.noHp,
      tanggal: formatTanggal(r.tanggal),
      jamMulai: formatJam(r.jamMulai),
      jamSelesai: formatJam(r.jamSelesai),
      jumlahTamu: r.jumlahTamu,
      statusReservasi: r.statusReservasi,
      statusPembayaran: r.statusPembayaran,
      totalBayar: Number(r.totalBayar),
      catatan: r.catatan,
      createdAt: r.createdAt.toISOString(),
      user: r.user,
      meja: r.meja,
      detailMenu: r.detailMenu.map((d) => ({
        id: d.id,
        jumlah: d.jumlah,
        subtotal: Number(d.subtotal),
        catatanKhusus: d.catatanKhusus,
        menu: d.menu
          ? {
              id: d.menu.id,
              namaMenu: d.menu.namaMenu,
              harga: Number(d.menu.harga),
            }
          : null,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: unknown) {
    console.error("Error GET /api/admin/reservasi:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Gagal mengambil data rekap reservasi.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
