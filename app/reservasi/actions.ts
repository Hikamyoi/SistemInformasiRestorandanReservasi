"use server";

import { after } from "next/server";
import { kirimNotifikasi } from "@/lib/push";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  buatReservasiSchema,
  type ReservasiActionResult,
} from "@/lib/validations/reservasi";

/* Tipe data menu dari database */
interface MenuItemDb {
  id: string;
  namaMenu: string;
  harga: any;
  statusKetersediaan: boolean;
}

/* Helper konversi string jam "13:30" ke Date ISO-8601 yang valid untuk kolom @db.Time Prisma */
function parseJamToDate(jamStr: string): Date {
  const parts = String(jamStr).split(":");
  const jam = parseInt(parts[0] || "0", 10);
  const menit = parseInt(parts[1] || "0", 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return new Date(`1970-01-01T${pad(jam)}:${pad(menit)}:00Z`);
}

/* Ambil data profil pengguna dari sesi login jika ada */
async function ambilDataUser(): Promise<{
  id: string;
  nama: string;
  noHp: string | null;
} | null> {
  try {
    const sesi = await getCurrentUser();
    if (!sesi?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: sesi.userId },
      select: { id: true, nama: true, noHp: true },
    });
    return user ?? null;
  } catch {
    return null;
  }
}

export async function buatReservasi(
  input: unknown,
): Promise<ReservasiActionResult> {
  try {
    // 1. Ambil info akun jika sedang login (jika tamu / guest, nilainya null)
    const user = await ambilDataUser();
    const userId = user?.id ?? null;

    // 2. Validasi kapasitas meja dari database
    const daftarMeja = await prisma.meja.findMany({
      select: { id: true, kapasitas: true, status: true },
    });
    const kapasitasMeja = Object.fromEntries(
      daftarMeja.map((m) => [m.id, m.kapasitas]),
    );

    const hasil = buatReservasiSchema(kapasitasMeja).safeParse(input);
    if (!hasil.success) {
      return {
        success: false,
        message:
          hasil.error.issues[0]?.message ?? "Data reservasi tidak valid.",
      };
    }
    const data = hasil.data;

    // 3. Cek ketersediaan meja
    const meja = daftarMeja.find((m) => m.id === data.mejaId);
    if (!meja)
      return { success: false, message: "Meja yang dipilih tidak ditemukan." };
    if (meja.status === "DIBLOKIR") {
      return {
        success: false,
        message: "Meja ini sedang tidak tersedia. Silakan pilih meja lain.",
      };
    }

    // 4. Ambil harga menu dari DATABASE & kalkulasi total bayar
    const menuIds = data.pesanan.map((p) => p.menuId);
    const daftarMenu: MenuItemDb[] = menuIds.length
      ? await prisma.menu.findMany({
          where: { id: { in: menuIds } },
          select: {
            id: true,
            namaMenu: true,
            harga: true,
            statusKetersediaan: true,
          },
        })
      : [];
    const petaMenu = new Map<string, MenuItemDb>(
      daftarMenu.map((m) => [m.id, m]),
    );

    const detailMenu: {
      menuId: string;
      jumlah: number;
      subtotal: number;
      catatanKhusus: string | null;
    }[] = [];
    let totalBayar = 0;

    for (const item of data.pesanan) {
      const menu = petaMenu.get(item.menuId);
      if (!menu)
        return {
          success: false,
          message: "Ada menu yang tidak ditemukan. Silakan muat ulang halaman.",
        };
      if (!menu.statusKetersediaan) {
        return {
          success: false,
          message: `Menu "${menu.namaMenu}" sedang habis. Silakan hapus dari pesanan.`,
        };
      }

      const hargaAngka = Number(menu.harga);
      const subtotal = hargaAngka * item.jumlah;
      totalBayar += subtotal;

      detailMenu.push({
        menuId: item.menuId,
        jumlah: item.jumlah,
        subtotal,
        catatanKhusus: item.catatanKhusus?.trim() || null,
      });
    }

    // 5. Konversi Tanggal & Jam ke format Date yang valid
    const tanggal = new Date(`${data.tanggal}T00:00:00.000Z`);
    const jamMulaiDate = parseJamToDate(data.jamMulai);
    const jamSelesaiDate = parseJamToDate(data.jamSelesai);

    // Generate kode booking unik (contoh: RSV-A8K2J9)
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const kodeBooking = `RSV-${randomCode}`;

    // Nama & No HP pemesan
    const inputObj = input as any;
    const namaPemesan =
      inputObj?.namaPemesan?.trim() || user?.nama || "Tamu Pelanggan";
    const noHp = inputObj?.noHp?.trim() || user?.noHp || "-";

    // 6. Transaksi Database: Cek Bentrok + Simpan Data Reservasi
    const hasilTransaksi = await prisma.$transaction(
      async (tx) => {
        // Cek bentrok jadwal menggunakan objek Date
        const bentrok = await tx.reservasi.findFirst({
          where: {
            mejaId: data.mejaId,
            tanggal,
            statusReservasi: { in: ["MENUNGGU_KONFIRMASI", "DIKONFIRMASI"] },
            jamMulai: { lt: jamSelesaiDate },
            jamSelesai: { gt: jamMulaiDate },
          },
          select: { id: true },
        });

        if (bentrok) return { bentrok: true as const };

        const reservasi = await tx.reservasi.create({
          data: {
            kodeBooking,
            userId,
            namaPemesan,
            noHp,
            mejaId: data.mejaId,
            tanggal,
            jamMulai: jamMulaiDate,
            jamSelesai: jamSelesaiDate,
            jumlahTamu: data.jumlahTamu,
            totalBayar: Math.round(totalBayar),
            statusReservasi: "DIKONFIRMASI",
            statusPembayaran: "LUNAS",
            catatan: data.catatan?.trim() || null,
            detailMenu: { create: detailMenu },
          },
          select: { id: true, kodeBooking: true },
        });

        return {
          bentrok: false as const,
          id: reservasi.id,
          kodeBooking: reservasi.kodeBooking,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    if (hasilTransaksi.bentrok) {
      return {
        success: false,
        message:
          "Meja ini sudah dipesan pada jam tersebut. Silakan pilih jam atau meja lain.",
      };
    }

    // Kirim Web Push Notification jika user sedang login
    if (userId) {
      after(() =>
        kirimNotifikasi(userId, {
          title: "Reservasi Diterima",
          body: `Reservasi Anda pada ${data.tanggal} pukul ${data.jamMulai} (${hasilTransaksi.kodeBooking}) telah berhasil dikonfirmasi.`,
          tag: `reservasi-${hasilTransaksi.id}`,
        }),
      );
    }

    return {
      success: true,
      message: `Reservasi berhasil! Kode Booking Anda: ${hasilTransaksi.kodeBooking}`,
    };
  } catch (error: any) {
    if (error?.code === "P2034") {
      return {
        success: false,
        message: "Sistem sedang sibuk. Silakan coba kirim lagi.",
      };
    }
    console.error("buatReservasi gagal:", error);
    return {
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    };
  }
}
