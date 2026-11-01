"use server";

import { after } from "next/server";
import { kirimNotifikasi } from "@/lib/push";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  buatReservasiSchema,
  type ReservasiActionResult,
} from "@/lib/validations/reservasi";


/* Ambil ID pengguna dari sesi login (cookie JWT "auth_token") */
async function ambilUserId(): Promise<string | null> {
  const sesi = await getCurrentUser();
  if (!sesi?.userId) return null;

  // Token berlaku 7 hari: pastikan akunnya masih ada di database
  const user = await prisma.user.findUnique({
    where: { id: sesi.userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function buatReservasi(input: unknown): Promise<ReservasiActionResult> {
  try {
    // --- Autentikasi: userId TIDAK pernah diambil dari form ---
    const userId = await ambilUserId();
    if (!userId) {
      return { success: false, message: "Silakan masuk terlebih dahulu untuk membuat reservasi." };
    }

    // --- Validasi ulang di server, kapasitas meja diambil dari database ---
    const daftarMeja = await prisma.meja.findMany({
      select: { id: true, kapasitas: true, status: true },
    });
    const kapasitasMeja = Object.fromEntries(daftarMeja.map((m) => [m.id, m.kapasitas]));

    const hasil = buatReservasiSchema(kapasitasMeja).safeParse(input);
    if (!hasil.success) {
      return {
        success: false,
        message: hasil.error.issues[0]?.message ?? "Data reservasi tidak valid.",
      };
    }
    const data = hasil.data;

    // --- Cek meja ---
    const meja = daftarMeja.find((m) => m.id === data.mejaId);
    if (!meja) return { success: false, message: "Meja yang dipilih tidak ditemukan." };
    if (meja.status === "DIBLOKIR") {
      return { success: false, message: "Meja ini sedang tidak tersedia. Silakan pilih meja lain." };
    }

    // --- Ambil harga menu dari DATABASE (bukan dari klien) & hitung total ---
    const menuIds = data.pesanan.map((p) => p.menuId);
    const daftarMenu = menuIds.length
      ? await prisma.menu.findMany({
          where: { id: { in: menuIds } },
          select: { id: true, namaMenu: true, harga: true, statusKetersediaan: true },
        })
      : [];
    const petaMenu = new Map(daftarMenu.map((m) => [m.id, m]));

    const detailMenu: {
      menuId: string;
      jumlah: number;
      subtotal: Prisma.Decimal;
      catatanKhusus: string | null;
    }[] = [];
    let totalBayar = new Prisma.Decimal(0);

    for (const item of data.pesanan) {
      const menu = petaMenu.get(item.menuId);
      if (!menu) return { success: false, message: "Ada menu yang tidak ditemukan. Muat ulang halaman." };
      if (!menu.statusKetersediaan) {
        return { success: false, message: `Menu "${menu.namaMenu}" sedang habis. Hapus dari pesanan.` };
      }
      const subtotal = menu.harga.mul(item.jumlah);
      totalBayar = totalBayar.add(subtotal);
      detailMenu.push({
        menuId: item.menuId,
        jumlah: item.jumlah,
        subtotal,
        catatanKhusus: item.catatanKhusus?.trim() || null,
      });
    }

    // --- Simpan dalam satu transaksi + cek bentrok jadwal ---
    // Kolom @db.Date: pakai tengah malam UTC agar tanggal tidak bergeser zona waktu
    const tanggal = new Date(`${data.tanggal}T00:00:00.000Z`);

    const hasilTransaksi = await prisma.$transaction(
      async (tx) => {
        // Bentrok bila: mulaiBaru < selesaiLama DAN selesaiBaru > mulaiLama
        const bentrok = await tx.reservasi.findFirst({
          where: {
            mejaId: data.mejaId,
            tanggal,
            statusReservasi: { in: ["MENUNGGU_KONFIRMASI", "DIKONFIRMASI"] },
            jamMulai: { lt: data.jamSelesai },
            jamSelesai: { gt: data.jamMulai },
          },
          select: { id: true },
        });
        if (bentrok) return { bentrok: true as const };

        const reservasi = await tx.reservasi.create({
          data: {
            userId,
            mejaId: data.mejaId,
            tanggal,
            jamMulai: data.jamMulai,
            jamSelesai: data.jamSelesai,
            jumlahTamu: data.jumlahTamu,
            totalBayar,
            catatan: data.catatan?.trim() || null,
            detailMenu: { create: detailMenu },
          },
          select: { id: true },
        });
        return { bentrok: false as const, id: reservasi.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (hasilTransaksi.bentrok) {
      return {
        success: false,
        message: "Meja ini sudah dipesan pada jam tersebut. Silakan pilih jam atau meja lain.",
      };
    }

after(() =>
  kirimNotifikasi(userId, {
    title: "Reservasi diterima",
    body: `Reservasi ${data.tanggal} pukul ${data.jamMulai} menunggu konfirmasi restoran.`,
    tag: `reservasi-${hasilTransaksi.id}`,
  })
);
    
    return {
      success: true,
      message: "Reservasi berhasil dikirim. Menunggu konfirmasi dari restoran.",
    };
  } catch (error) {
    // P2034 = konflik penulisan pada transaksi Serializable
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return { success: false, message: "Sistem sedang sibuk. Silakan coba kirim lagi." };
    }
    console.error("buatReservasi gagal:", error);
    return { success: false, message: "Terjadi kesalahan pada server. Silakan coba lagi." };
  }
}