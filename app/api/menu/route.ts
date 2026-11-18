// app/api/menu/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      where: {
        statusKetersediaan: true,
      },
      orderBy: [
        { isPopuler: "desc" },
        { kategori: { urutan: "asc" } },
        { namaMenu: "asc" },
      ],
      include: {
        kategori: {
          select: {
            id: true,
            namaKategori: true,
            urutan: true,
          },
        },
      },
    });

    const formatted = menus.map((m) => ({
      id: m.id,
      namaMenu: m.namaMenu,
      harga: Number(m.harga),
      fotoUrl: m.fotoUrl,
      deskripsi: m.deskripsi,
      statusKetersediaan: m.statusKetersediaan,
      isPopuler: m.isPopuler,
      kategoriId: m.kategoriId,
      kategori: m.kategori?.namaKategori || "Lainnya",
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error("Error GET /api/menu:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memuat daftar menu." },
      { status: 500 },
    );
  }
}
