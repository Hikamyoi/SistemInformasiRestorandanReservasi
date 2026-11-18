// app/api/reservasi/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StatusReservasi } from "@prisma/client";

interface ItemMenuPesanan {
  menuId: string;
  jumlah: number;
  catatanKhusus?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      namaPemesan,
      noHp,
      mejaId,
      tanggal, // 'YYYY-MM-DD'
      jam, // '12:00' atau '12:00:00'
      jamSelesai, // opsional: '14:00'
      durasiJam = 2, // Default rentang waktu reservasi 2 jam jika jamSelesai tidak dikirim
      jumlahTamu,
      catatan,
      items = [], // Array<{ menuId: string, jumlah: number, catatanKhusus?: string }>
      userId = null, // Opsional (jika tamu checkout tanpa login bernilai null)
    } = body;

    // 1. Validasi Input Dasar
    if (!namaPemesan || !noHp || !mejaId || !tanggal || !jam || !jumlahTamu) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Data pemesanan tidak lengkap. Pastikan namaPemesan, noHp, mejaId, tanggal, jam, dan jumlahTamu terisi.",
        },
        { status: 400 },
      );
    }

    if (Number(jumlahTamu) <= 0) {
      return NextResponse.json(
        { success: false, error: "Jumlah tamu minimal harus 1 orang." },
        { status: 400 },
      );
    }

    // 2. Parse Tanggal & Rentang Waktu
    const targetTanggal = new Date(tanggal);
    if (isNaN(targetTanggal.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid. Gunakan YYYY-MM-DD.",
        },
        { status: 400 },
      );
    }

    const jamParts = String(jam).split(":");
    const jamNum = parseInt(jamParts[0], 10);
    const menitNum = parseInt(jamParts[1] || "0", 10);
    const pad = (n: number) => String(n).padStart(2, "0");

    const targetMulai = new Date(
      `1970-01-01T${pad(jamNum)}:${pad(menitNum)}:00Z`,
    );

    let targetSelesai: Date;
    if (jamSelesai) {
      const selesaiParts = String(jamSelesai).split(":");
      const selesaiJam = parseInt(selesaiParts[0], 10);
      const selesaiMenit = parseInt(selesaiParts[1] || "0", 10);

      if (
        isNaN(selesaiJam) ||
        isNaN(selesaiMenit) ||
        selesaiJam < 0 ||
        selesaiJam > 23 ||
        selesaiMenit < 0 ||
        selesaiMenit > 59
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Format jam selesai tidak valid. Gunakan HH:mm.",
          },
          { status: 400 },
        );
      }

      targetSelesai = new Date(
        `1970-01-01T${pad(selesaiJam)}:${pad(selesaiMenit)}:00Z`,
      );
      if (targetSelesai <= targetMulai) {
        return NextResponse.json(
          {
            success: false,
            error: "Jam selesai harus lebih malam daripada jam kedatangan.",
          },
          { status: 400 },
        );
      }
    } else {
      targetSelesai = new Date(
        targetMulai.getTime() + Number(durasiJam) * 60 * 60 * 1000,
      );
    }

    // 3. Ambil Data Menu Pre-Order Sebelum Membuka Transaksi (agar transaksi sangat cepat)
    const validItems = Array.isArray(items)
      ? (items as ItemMenuPesanan[]).filter(
          (i) => i.menuId && Number(i.jumlah) > 0,
        )
      : [];

    let totalBayar = 0;
    const detailInserts: {
      menuId: string;
      jumlah: number;
      subtotal: number;
      catatanKhusus: string | null;
    }[] = [];

    if (validItems.length > 0) {
      const menuIds = Array.from(new Set(validItems.map((i) => i.menuId)));
      const menusFromDb = await prisma.menu.findMany({
        where: { id: { in: menuIds } },
      });
      const menuMap = new Map(menusFromDb.map((m) => [m.id, m]));

      for (const item of validItems) {
        const menuItem = menuMap.get(item.menuId);
        if (!menuItem) {
          return NextResponse.json(
            {
              success: false,
              error: `Menu dengan ID ${item.menuId} tidak ditemukan.`,
            },
            { status: 400 },
          );
        }
        if (!menuItem.statusKetersediaan) {
          return NextResponse.json(
            {
              success: false,
              error: `Menu "${menuItem.namaMenu}" saat ini sedang habis/tidak tersedia.`,
            },
            { status: 400 },
          );
        }

        const hargaSatuan = Number(menuItem.harga);
        const subtotal = hargaSatuan * Number(item.jumlah);
        totalBayar += subtotal;

        detailInserts.push({
          menuId: item.menuId,
          jumlah: Number(item.jumlah),
          subtotal: subtotal,
          catatanKhusus: item.catatanKhusus || null,
        });
      }
    }

    // 4. Eksekusi Atomic Prisma Transaction untuk Mencegah Double Booking (Race Condition)
    const hasilReservasi = await prisma.$transaction(
      async (tx) => {
        // A. Validasi Meja
        const meja = await tx.meja.findUnique({ where: { id: mejaId } });
        if (!meja) {
          throw new Error("Meja yang dipilih tidak ditemukan dalam sistem.");
        }
        if (meja.status === "DIBLOKIR") {
          throw new Error(
            `Meja ${meja.nomorMeja} sedang diblokir/tidak dapat digunakan.`,
          );
        }
        if (Number(jumlahTamu) > meja.kapasitas) {
          throw new Error(
            `Jumlah tamu (${jumlahTamu} orang) melebihi kapasitas maksimal Meja ${meja.nomorMeja} (${meja.kapasitas} kursi).`,
          );
        }

        // B. Cek Benturan Jadwal (Anti-Double Booking)
        const benturan = await tx.reservasi.findFirst({
          where: {
            mejaId: mejaId,
            tanggal: targetTanggal,
            statusReservasi: { not: StatusReservasi.DIBATALKAN },
            AND: [
              { jamMulai: { lt: targetSelesai } },
              { jamSelesai: { gt: targetMulai } },
            ],
          },
        });

        if (benturan) {
          throw new Error(
            `Maaf! Meja ${meja.nomorMeja} baru saja dipesan oleh pelanggan lain pada jam tersebut. Silakan pilih meja atau jam lain.`,
          );
        }

        // C. Generate Kode Booking Unik (Format: RSV-XXXXXX)
        const randomCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();
        const kodeBooking = `RSV-${randomCode}`;

        // D. Buat Record Reservasi dengan status pembayaran langsung LUNAS
        const reservasiBaru = await tx.reservasi.create({
          data: {
            kodeBooking: kodeBooking,
            userId: userId || null, // Mendukung tamu / guest checkout tanpa login
            namaPemesan: namaPemesan.trim(),
            noHp: noHp.trim(),
            mejaId: mejaId,
            tanggal: targetTanggal,
            jamMulai: targetMulai,
            jamSelesai: targetSelesai,
            jumlahTamu: Number(jumlahTamu),
            catatan: catatan?.trim() || null,
            totalBayar: Math.round(totalBayar),
            statusReservasi: StatusReservasi.DIKONFIRMASI,
            statusPembayaran: "LUNAS", // Pembayaran langsung lunas sekali jalan
            detailMenu: {
              create: detailInserts,
            },
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

        return reservasiBaru;
      },
      {
        maxWait: 20000, // Tunggu koneksi Supabase hingga 20 detik
        timeout: 25000, // Batas eksekusi transaksi 25 detik
      },
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Reservasi berhasil dibuat dan pembayaran telah terkonfirmasi LUNAS!",
        data: hasilReservasi,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error POST /api/reservasi:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Terjadi kesalahan saat memproses reservasi.",
      },
      { status: 400 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const tanggal = searchParams.get("tanggal");

    const where: any = {};
    if (userId) where.userId = userId;
    if (tanggal) where.tanggal = new Date(tanggal);

    const data = await prisma.reservasi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        meja: true,
        detailMenu: { include: { menu: true } },
      },
      take: 50,
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
