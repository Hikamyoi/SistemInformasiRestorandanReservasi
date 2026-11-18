import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RuanganEnum = z.enum([
  "INDOOR_NON_SMOKING",
  "OUTDOOR_SMOKING",
  "VIP_NON_SMOKING",
]);

function defaultLokasiByRuangan(ruangan) {
  switch (ruangan) {
    case "VIP_NON_SMOKING":
      return "Private VIP Room";
    case "OUTDOOR_SMOKING":
      return "Outdoor Garden Breeze";
    case "INDOOR_NON_SMOKING":
    default:
      return "Indoor Hall Utama";
  }
}

// Skema Dasar untuk Update Parsial (tanpa .default agar field yang tidak dikirim tidak tertimpa)
const mejaUpdateSchema = z
  .object({
    nomorMeja: z.string().trim().min(1, "Nomor meja wajib diisi").max(20),
    kapasitas: z.coerce
      .number()
      .int("Kapasitas harus bilangan bulat")
      .min(1, "Kapasitas minimal 1 orang")
      .max(50, "Kapasitas maksimal 50 orang"),
    status: z.enum(["TERSEDIA", "DIISI", "DIBLOKIR"]),
    ruangan: RuanganEnum,
    lokasiArea: z.string().trim().min(2, "Lokasi area wajib diisi").max(50),
    viewMeja: z.string().trim().max(150).nullable().optional(),
  })
  .partial();

// Skema Validasi Zod untuk Tambah Meja Baru
const mejaCreateSchema = z.object({
  nomorMeja: z.string().trim().min(1, "Nomor meja wajib diisi").max(20),
  kapasitas: z.coerce
    .number()
    .int("Kapasitas harus bilangan bulat")
    .min(1, "Kapasitas minimal 1 orang")
    .max(50, "Kapasitas maksimal 50 orang"),
  status: z.enum(["TERSEDIA", "DIISI", "DIBLOKIR"]).default("TERSEDIA"),
  ruangan: RuanganEnum.default("INDOOR_NON_SMOKING"),
  lokasiArea: z.string().trim().max(50).optional(),
  viewMeja: z.string().trim().max(150).nullable().optional(),
});

// 1. GET: Ambil daftar seluruh meja
export async function GET() {
  try {
    const mejaList = await prisma.meja.findMany({
      orderBy: [{ ruangan: "asc" }, { nomorMeja: "asc" }],
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
    const validation = mejaCreateSchema.safeParse(body);

    if (!validation.success) {
      const pesanPertama =
        validation.error.issues?.[0]?.message || "Data meja tidak valid";
      return NextResponse.json(
        {
          success: false,
          message: pesanPertama,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { nomorMeja, kapasitas, status, ruangan, lokasiArea, viewMeja } =
      validation.data;

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
      data: {
        nomorMeja,
        kapasitas,
        status,
        ruangan,
        lokasiArea:
          lokasiArea && lokasiArea.length >= 2
            ? lokasiArea
            : defaultLokasiByRuangan(ruangan),
        viewMeja: viewMeja ? viewMeja : null,
      },
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

    const validation = mejaUpdateSchema.safeParse(dataToUpdate);
    if (!validation.success) {
      const pesanPertama =
        validation.error.issues?.[0]?.message || "Data update meja tidak valid";
      return NextResponse.json(
        {
          success: false,
          message: pesanPertama,
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const dataBersih = { ...validation.data };
    if ("viewMeja" in dataBersih) {
      dataBersih.viewMeja = dataBersih.viewMeja || null;
    }

    const updatedMeja = await prisma.meja.update({
      where: { id },
      data: dataBersih,
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
    const isForeignKey =
      error instanceof Error && error.message.includes("Foreign key");
    return NextResponse.json(
      {
        success: false,
        message: isForeignKey
          ? "Meja sudah memiliki riwayat reservasi, ubah status ke DIBLOKIR jika ingin menonaktifkan"
          : "Gagal menghapus meja",
      },
      { status: isForeignKey ? 400 : 500 },
    );
  }
}
