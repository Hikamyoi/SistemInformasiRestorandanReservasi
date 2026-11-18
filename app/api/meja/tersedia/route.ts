// app/api/meja/tersedia/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tanggalStr = searchParams.get("tanggal"); // format: 'YYYY-MM-DD'
    const jamStr = searchParams.get("jam"); // format: '12:00' atau '12:00:00'
    const jamSelesaiStr = searchParams.get("jamSelesai"); // opsional: '14:00'
    const ruangan = searchParams.get("ruangan");
    const durasiJam = Number(searchParams.get("durasi") || 2);

    if (!tanggalStr || !jamStr) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Parameter "tanggal" (YYYY-MM-DD) dan "jam" (HH:mm) wajib disertakan.',
        },
        { status: 400 },
      );
    }

    const targetTanggal = new Date(tanggalStr);
    if (isNaN(targetTanggal.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format parameter "tanggal" tidak valid (gunakan YYYY-MM-DD).',
        },
        { status: 400 },
      );
    }

    const jamParts = jamStr.split(":");
    const jamNum = parseInt(jamParts[0], 10);
    const menitNum = parseInt(jamParts[1] || "0", 10);

    if (
      isNaN(jamNum) ||
      isNaN(menitNum) ||
      jamNum < 0 ||
      jamNum > 23 ||
      menitNum < 0 ||
      menitNum > 59
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format parameter "jam" tidak valid (gunakan HH:mm).',
        },
        { status: 400 },
      );
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const targetMulai = new Date(
      `1970-01-01T${pad(jamNum)}:${pad(menitNum)}:00Z`,
    );

    let targetSelesai: Date;
    if (jamSelesaiStr) {
      const selesaiParts = jamSelesaiStr.split(":");
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
            error: 'Format parameter "jamSelesai" tidak valid (gunakan HH:mm).',
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
            error: "Jam selesai harus lebih besar dari jam kedatangan.",
          },
          { status: 400 },
        );
      }
    } else {
      targetSelesai = new Date(
        targetMulai.getTime() + durasiJam * 60 * 60 * 1000,
      );
    }

    const whereMeja: any = {
      status: { not: "DIBLOKIR" },
    };

    if (ruangan && ruangan !== "ALL") {
      whereMeja.ruangan = ruangan;
    }

    const semuaMeja = await prisma.meja.findMany({
      where: whereMeja,
      orderBy: [{ ruangan: "asc" }, { nomorMeja: "asc" }],
      include: {
        reservasi: {
          where: {
            tanggal: targetTanggal,
            statusReservasi: { not: "DIBATALKAN" },
            AND: [
              { jamMulai: { lt: targetSelesai } },
              { jamSelesai: { gt: targetMulai } },
            ],
          },
          select: {
            id: true,
            kodeBooking: true,
            statusReservasi: true,
            statusPembayaran: true,
          },
        },
      },
    });

    const daftarMeja = semuaMeja.map((meja) => {
      const adaReservasiAktif = meja.reservasi.length > 0;
      const isTersedia = !adaReservasiAktif && meja.status === "TERSEDIA";

      return {
        id: meja.id,
        nomorMeja: meja.nomorMeja,
        kapasitas: meja.kapasitas,
        ruangan: meja.ruangan,
        viewMeja: meja.viewMeja,
        posisiX: meja.posisiX,
        posisiY: meja.posisiY,
        lokasiArea: meja.lokasiArea,
        statusMeja: meja.status,
        isTersedia,
        reservasiAktif: adaReservasiAktif
          ? {
              statusReservasi: meja.reservasi[0].statusReservasi,
              statusPembayaran: meja.reservasi[0].statusPembayaran,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        filter: {
          tanggal: tanggalStr,
          jamMulai: `${pad(jamNum)}:${pad(menitNum)}`,
          jamSelesai: `${pad(targetSelesai.getUTCHours())}:${pad(
            targetSelesai.getUTCMinutes(),
          )}`,
          durasiJam:
            (targetSelesai.getTime() - targetMulai.getTime()) /
            (60 * 60 * 1000),
          ruangan: ruangan || "ALL",
        },
        totalMeja: daftarMeja.length,
        totalTersedia: daftarMeja.filter((m) => m.isTersedia).length,
        meja: daftarMeja,
      },
    });
  } catch (error: any) {
    console.error("Error GET /api/meja/tersedia:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memeriksa ketersediaan meja",
        detail: error.message,
      },
      { status: 500 },
    );
  }
}
