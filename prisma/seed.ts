import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding data dummy...");

  // 1. Hash Password Bawaan
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

  // 2. Seed User Staf & Pelanggan
  console.log("👤 Seeding User...");
  let staff = await prisma.user.findFirst({ where: { email: "staff@resto.com" } });
  if (!staff) {
    staff = await prisma.user.create({
      data: {
        email: "staff@resto.com",
        nama: "Budi Staf Kasir",
        passwordHash: defaultPasswordHash,
        role: "STAF",
        noHp: "082222222222",
      },
    });
  }

  let customer1 = await prisma.user.findFirst({ where: { email: "pelanggan1@gmail.com" } });
  if (!customer1) {
    customer1 = await prisma.user.create({
      data: {
        email: "pelanggan1@gmail.com",
        nama: "Siti Rahma",
        passwordHash: defaultPasswordHash,
        role: "PELANGGAN",
        noHp: "083333333333",
      },
    });
  }

  let customer2 = await prisma.user.findFirst({ where: { email: "pelanggan2@gmail.com" } });
  if (!customer2) {
    customer2 = await prisma.user.create({
      data: {
        email: "pelanggan2@gmail.com",
        nama: "Andi Pratama",
        passwordHash: defaultPasswordHash,
        role: "PELANGGAN",
        noHp: "084444444444",
      },
    });
  }

  // 3. Seed Meja Restoran (Gunakan findFirst agar aman)
  console.log("🪑 Seeding Meja...");
  let meja1 = await prisma.meja.findFirst({ where: { nomorMeja: "1" } });
  if (!meja1) {
    meja1 = await prisma.meja.create({
      data: { nomorMeja: "1", kapasitas: 4, lokasiArea: "INDOOR" },
    });
  }

  let meja2 = await prisma.meja.findFirst({ where: { nomorMeja: "2" } });
  if (!meja2) {
    meja2 = await prisma.meja.create({
      data: { nomorMeja: "2", kapasitas: 2, lokasiArea: "OUTDOOR" },
    });
  }

  let meja3 = await prisma.meja.findFirst({ where: { nomorMeja: "3" } });
  if (!meja3) {
    meja3 = await prisma.meja.create({
      data: { nomorMeja: "3", kapasitas: 6, lokasiArea: "VIP" },
    });
  }

  // 4. Seed Menu Makanan/Minuman
  console.log("🍽️ Seeding Menu...");
  let kategoriMakanan = await prisma.kategoriMenu.findFirst({ where: { namaKategori: "MAKANAN" } });
  if (!kategoriMakanan) {
    kategoriMakanan = await prisma.kategoriMenu.create({ data: { namaKategori: "MAKANAN" } });
  }

  let kategoriMinuman = await prisma.kategoriMenu.findFirst({ where: { namaKategori: "MINUMAN" } });
  if (!kategoriMinuman) {
    kategoriMinuman = await prisma.kategoriMenu.create({ data: { namaKategori: "MINUMAN" } });
  }

  let menu1 = await prisma.menu.findFirst({ where: { namaMenu: "Nasi Goreng Spesial" } });
  if (!menu1) {
    menu1 = await prisma.menu.create({
      data: {
        namaMenu: "Nasi Goreng Spesial",
        harga: 35000,
        kategoriId: kategoriMakanan.id,
        statusKetersediaan: true,
      },
    });
  }

  let menu2 = await prisma.menu.findFirst({ where: { namaMenu: "Ayam Bakar Madu" } });
  if (!menu2) {
    menu2 = await prisma.menu.create({
      data: {
        namaMenu: "Ayam Bakar Madu",
        harga: 45000,
        kategoriId: kategoriMakanan.id,
        statusKetersediaan: true,
      },
    });
  }

  let menu3 = await prisma.menu.findFirst({ where: { namaMenu: "Es Teh Manis" } });
  if (!menu3) {
    menu3 = await prisma.menu.create({
      data: {
        namaMenu: "Es Teh Manis",
        harga: 8000,
        kategoriId: kategoriMinuman.id,
        statusKetersediaan: true,
      },
    });
  }

  // 5. Seed Reservasi Dummy untuk Pengujian Kasir & Staf
  console.log("📋 Seeding Reservasi & Detail Pesanan...");
  const today = new Date();

  // Variasi 1: MENUNGGU_KONFIRMASI (Untuk Alokasi Meja Staf)
  await prisma.reservasi.create({
    data: {
      userId: customer1.id,
      mejaId: meja1.id,
      tanggal: today,
      jamMulai: "18:00",
      jamSelesai: "19:30",
      jumlahTamu: 4,
      statusReservasi: "MENUNGGU_KONFIRMASI",
      statusPembayaran: "BELUM_BAYAR",
      totalBayar: 78000,
      catatan: "Dekat jendela",
      detailMenu: {
        create: [
          { menuId: menu1.id, jumlah: 2, subtotal: 70000 },
          { menuId: menu3.id, jumlah: 1, subtotal: 8000 },
        ],
      },
    },
  });

  // Variasi 2: DIKONFIRMASI & BELUM_BAYAR (Untuk Tes Transaksi Kasir)
  await prisma.reservasi.create({
    data: {
      userId: customer2.id,
      mejaId: meja2.id,
      tanggal: today,
      jamMulai: "19:00",
      jamSelesai: "20:30",
      jumlahTamu: 2,
      statusReservasi: "DIKONFIRMASI",
      statusPembayaran: "BELUM_BAYAR",
      totalBayar: 98000,
      detailMenu: {
        create: [
          { menuId: menu2.id, jumlah: 2, subtotal: 90000 },
          { menuId: menu3.id, jumlah: 1, subtotal: 8000 },
        ],
      },
    },
  });

  console.log("✅ Seeding data dummy berhasil!");
}

main()
  .catch((e) => {
    console.error("❌ ERROR DETAIL SEEDING:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });