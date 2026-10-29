import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Skema Validasi Zod untuk Input Menu
const menuSchema = z.object({
  namaMenu: z.string().min(2, "Nama menu minimal 2 karakter").max(150),
  kategoriId: z.string().uuid("ID Kategori harus UUID yang valid"),
  harga: z.coerce.number().positive("Harga harus lebih dari 0"),
  fotoUrl: z
    .string()
    .url("URL Foto harus berupa link URL valid")
    .optional()
    .nullable(),
  deskripsi: z.string().optional().nullable(),
  statusKetersediaan: z.boolean().default(true),
});

// 1. GET: Ambil semua data menu beserta kategori
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const kategoriId = searchParams.get("kategoriId");

    const menus = await prisma.menu.findMany({
      where: kategoriId ? { kategoriId } : undefined,
      include: {
        kategori: {
          select: { id: true, namaKategori: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: menus });
  } catch (error) {
    console.error("Error GET Menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil menu" },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah menu baru
export async function POST(request) {
  try {
    const body = await request.json();
    const validation = menuSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      namaMenu,
      kategoriId,
      harga,
      fotoUrl,
      deskripsi,
      statusKetersediaan,
    } = validation.data;

    const newMenu = await prisma.menu.create({
      data: {
        namaMenu,
        kategoriId,
        harga,
        fotoUrl: fotoUrl || null,
        deskripsi: deskripsi || null,
        statusKetersediaan,
      },
      include: { kategori: true },
    });

    return NextResponse.json(
      { success: true, message: "Menu berhasil ditambahkan", data: newMenu },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error POST Menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan menu" },
      { status: 500 },
    );
  }
}

// 3. PUT: Update data menu berdasarkan ID
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Menu wajib disertakan" },
        { status: 400 },
      );
    }

    const validation = menuSchema.partial().safeParse(dataToUpdate);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updatedMenu = await prisma.menu.update({
      where: { id },
      data: validation.data,
      include: { kategori: true },
    });

    return NextResponse.json({
      success: true,
      message: "Menu berhasil diupdate",
      data: updatedMenu,
    });
  } catch (error) {
    console.error("Error PUT Menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate menu" },
      { status: 500 },
    );
  }
}

// 4. DELETE: Hapus menu (?id=uuid)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Parameter id wajib disertakan" },
        { status: 400 },
      );
    }

    await prisma.menu.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    console.error("Error DELETE Menu:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus menu" },
      { status: 500 },
    );
  }
}
