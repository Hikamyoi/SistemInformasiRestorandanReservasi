import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Skema Validasi Zod untuk Input Meja
const mejaSchema = z.object({
  nomorMeja: z.string().min(1, "Nomor meja wajib diisi").max(20),
  kapasitas: z.coerce
    .number()
    .int()
    .min(1, "Kapasitas minimal 1 orang")
    .max(50),
  status: z.enum(["TERSEDIA", "DIISI", "DIBLOKIR"]).default("TERSEDIA"),
  lokasiArea: z
    .string()
    .min(2, "Lokasi area wajib diisi")
    .max(50)
    .default("Indoor"),
});

// 1. GET: Ambil daftar seluruh meja
export async function GET() {
  try {
    const mejaList = await prisma.meja.findMany({
      orderBy: { nomorMeja: "asc" },
    });

    return NextResponse.json({ success: true, data: mejaList });
  } catch (error) {
    console.error("Error GET Meja:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data meja" },
      { status: 500 },
    );
  }
}

// 2. POST: Tambah meja baru
export async function POST(request) {
  try {
    const body = await request.json();
    const validation = mejaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { nomorMeja, kapasitas, status, lokasiArea } = validation.data;

    // Cek duplikasi nomor meja
    const existing = await prisma.meja.findUnique({
      where: { nomorMeja },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Meja ${nomorMeja} sudah terdaftar!` },
        { status: 409 },
      );
    }

    const newMeja = await prisma.meja.create({
      data: { nomorMeja, kapasitas, status, lokasiArea },
    });

    return NextResponse.json(
      { success: true, message: "Meja berhasil ditambahkan", data: newMeja },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error POST Meja:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan meja" },
      { status: 500 },
    );
  }
}

// 3. PUT: Update meja berdasarkan ID
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID Meja wajib disertakan" },
        { status: 400 },
      );
    }

    const validation = mejaSchema.partial().safeParse(dataToUpdate);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updatedMeja = await prisma.meja.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      message: "Meja berhasil diupdate",
      data: updatedMeja,
    });
  } catch (error) {
    console.error("Error PUT Meja:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengupdate meja" },
      { status: 500 },
    );
  }
}

// 4. DELETE: Hapus meja (?id=uuid)
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

    await prisma.meja.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Meja berhasil dihapus",
    });
  } catch (error) {
    console.error("Error DELETE Meja:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus meja" },
      { status: 500 },
    );
  }
}
