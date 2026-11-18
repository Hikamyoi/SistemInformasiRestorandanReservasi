// app/api/reservasi/[kode]/addon/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusReservasi } from "@prisma/client";

interface AddonItemInput {
  menuId: string;
  jumlah: number;
  catatanKhusus?: string;
}

export async function POST(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const { kode } = resolvedParams;

    if (!kode) {
      return NextResponse.json(
        { success: false, error: "Kode booking wajib dicantumkan." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { items = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Daftar item tambahan tidak boleh kosong." },
        { status: 400 },
      );
    }

    // 1. Validasi & Ambil Data Menu Sekaligus Sebelum Membuka Transaksi
    const validItems = (items as AddonItemInput[]).filter(
      (i) => i.menuId && Number(i.jumlah) > 0,
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tidak ada menu valid yang ditambahkan." },
        { status: 400 },
      );
    }

    const menuIds = Array.from(new Set(validItems.map((i) => i.menuId)));
    const menusFromDb = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
    });
    const menuMap = new Map(menusFromDb.map((m) => [m.id, m]));

    let tambahanTotal = 0;
    const preparedItems: {
      menuId: string;
      jumlah: number;
      subtotal: number;
      catatanKhusus: string;
    }[] = [];

    for (const item of validItems) {
      const menuItem = menuMap.get(item.menuId);
      if (!menuItem) {
        return NextResponse.json(
          { success: false, error: "Menu tidak ditemukan." },
          { status: 400 },
        );
      }
      if (!menuItem.statusKetersediaan) {
        return NextResponse.json(
          {
            success: false,
            error: `Menu "${menuItem.namaMenu}" sedang habis.`,
          },
          { status: 400 },
        );
      }

      const hargaSatuan = Number(menuItem.harga);
      const subtotal = hargaSatuan * Number(item.jumlah);
      tambahanTotal += subtotal;

      preparedItems.push({
        menuId: item.menuId,
        jumlah: Number(item.jumlah),
        subtotal,
        catatanKhusus: item.catatanKhusus
          ? `[Add-On] ${item.catatanKhusus}`
          : "[Add-On Pesanan]",
      });
    }

    // 2. Eksekusi Atomic Transaction (ringan & cepat dengan timeout longgar)
    const hasilAddon = await prisma.$transaction(
      async (tx) => {
        const reservasi = await tx.reservasi.findUnique({
          where: { kodeBooking: kode },
        });

        if (!reservasi) {
          throw new Error(`Reservasi dengan kode "${kode}" tidak ditemukan.`);
        }

        if (reservasi.statusReservasi === StatusReservasi.DIBATALKAN) {
          throw new Error(
            "Tidak dapat menambah menu karena reservasi sudah DIBATALKAN.",
          );
        }

        if (reservasi.statusReservasi === StatusReservasi.SELESAI) {
          throw new Error(
            "Tidak dapat menambah menu karena reservasi sudah SELESAI.",
          );
        }

        await tx.detailReservasiMenu.createMany({
          data: preparedItems.map((item) => ({
            reservasiId: reservasi.id,
            menuId: item.menuId,
            jumlah: item.jumlah,
            subtotal: item.subtotal,
            catatanKhusus: item.catatanKhusus,
          })),
        });

        const totalBaru =
          Number(reservasi.totalBayar) + Math.round(tambahanTotal);

        const reservasiUpdated = await tx.reservasi.update({
          where: { id: reservasi.id },
          data: {
            totalBayar: totalBaru,
          },
          include: {
            meja: true,
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

        return {
          reservasi: reservasiUpdated,
          itemDitambahkan: preparedItems,
          nominalTambahan: Math.round(tambahanTotal),
          totalBayarSebelumnya: Number(reservasi.totalBayar),
          totalBayarBaru: totalBaru,
        };
      },
      {
        maxWait: 20000,
        timeout: 25000,
      },
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan item menu ke reservasi ${kode}.`,
      data: hasilAddon,
    });
  } catch (error: any) {
    console.error("Error POST addon:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan pesanan." },
      { status: 400 },
    );
  }
}
