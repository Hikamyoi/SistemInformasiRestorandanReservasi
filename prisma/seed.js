// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding data dummy...");

  // 1. HASH PASSWORD DEFAULT: "Password123!"
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("Password123!", salt);

  // 2. SEED 3 USER (Admin, Staf, Pelanggan)
  console.log("👤 Seeding 3 User dummy...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@resto.com" },
    update: {},
    create: {
      nama: "Admin Resto (Budi Santoso)",
      email: "admin@resto.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      noHp: "081234567890",
    },
  });

  const staf = await prisma.user.upsert({
    where: { email: "staf@resto.com" },
    update: {},
    create: {
      nama: "Staf Kasir (Siti Rahma)",
      email: "staf@resto.com",
      passwordHash: defaultPasswordHash,
      role: "STAF",
      noHp: "081234567891",
    },
  });

  const pelanggan = await prisma.user.upsert({
    where: { email: "andi@gmail.com" },
    update: {},
    create: {
      nama: "Andi Wijaya (Pelanggan)",
      email: "andi@gmail.com",
      passwordHash: defaultPasswordHash,
      role: "PELANGGAN",
      noHp: "081234567892",
    },
  });

  // 3. SEED 5 MEJA (Kapasitas bervariasi 2 - 8 orang)
  console.log("🪑 Seeding 5 Meja...");
  const mejaList = [
    {
      nomorMeja: "M-01",
      kapasitas: 2,
      status: "TERSEDIA",
      lokasiArea: "Indoor Cozy",
    },
    {
      nomorMeja: "M-02",
      kapasitas: 4,
      status: "TERSEDIA",
      lokasiArea: "Indoor Main Hall",
    },
    {
      nomorMeja: "M-03",
      kapasitas: 4,
      status: "DIISI",
      lokasiArea: "Outdoor Garden",
    },
    {
      nomorMeja: "VIP-01",
      kapasitas: 8,
      status: "TERSEDIA",
      lokasiArea: "Private VIP Room",
    },
    {
      nomorMeja: "R-01",
      kapasitas: 6,
      status: "DIBLOKIR",
      lokasiArea: "Rooftop Lounge",
    },
  ];

  for (const m of mejaList) {
    await prisma.meja.upsert({
      where: { nomorMeja: m.nomorMeja },
      update: {},
      create: m,
    });
  }

  // 4. SEED 5 KATEGORI MENU
  console.log("📂 Seeding 5 Kategori Menu...");
  const kategoriList = [
    { namaKategori: "Makanan Utama", urutan: 1 },
    { namaKategori: "Makanan Pembuka", urutan: 2 },
    { namaKategori: "Minuman Segar", urutan: 3 },
    { namaKategori: "Kopi & Teh", urutan: 4 },
    { namaKategori: "Dessert & Penutup", urutan: 5 },
  ];

  const createdKategori = {};
  for (const kat of kategoriList) {
    const k = await prisma.kategoriMenu.upsert({
      where: { namaKategori: kat.namaKategori },
      update: {},
      create: kat,
    });
    createdKategori[kat.namaKategori] = k.id;
  }

  // 5. SEED 6 MENU LENGKAP (Harga, Foto, dan Status)
  console.log("🍽️ Seeding Menu Makanan & Minuman...");
  const menuList = [
    {
      kategoriId: createdKategori["Makanan Utama"],
      namaMenu: "Nasi Goreng Wagyu Spesial",
      harga: 55000,
      fotoUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
      deskripsi:
        "Nasi goreng rempah nusantara dengan potongan daging wagyu lembut dan telur mata sapi.",
      statusKetersediaan: true,
    },
    {
      kategoriId: createdKategori["Makanan Utama"],
      namaMenu: "Grilled Salmon Lemon Butter",
      harga: 85000,
      fotoUrl:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
      deskripsi:
        "Fillet salmon panggang segar dengan saus mentega lemon dan baby potatoes.",
      statusKetersediaan: true,
    },
    {
      kategoriId: createdKategori["Makanan Pembuka"],
      namaMenu: "Tahu Crispy Cabai Garam",
      harga: 25000,
      fotoUrl:
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600",
      deskripsi:
        "Tahu sutra garing bertabur bawang putih dan irisan cabai rawit gurih.",
      statusKetersediaan: true,
    },
    {
      kategoriId: createdKategori["Kopi & Teh"],
      namaMenu: "Es Kopi Susu Gula Aren Senja",
      harga: 22000,
      fotoUrl:
        "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600",
      deskripsi:
        "Double shot espresso dipadu susu segar dan sirup gula aren organik premium.",
      statusKetersediaan: true,
    },
    {
      kategoriId: createdKategori["Minuman Segar"],
      namaMenu: "Lychee Iced Tea Refresher",
      harga: 20000,
      fotoUrl:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
      deskripsi: "Teh melati dingin harum dengan buah leci segar pilihan.",
      statusKetersediaan: true,
    },
    {
      kategoriId: createdKategori["Dessert & Penutup"],
      namaMenu: "Lava Cake Cokelat Belgia",
      harga: 35000,
      fotoUrl:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
      deskripsi:
        "Kue cokelat leleh hangat disajikan dengan satu scoop es krim vanila.",
      statusKetersediaan: true,
    },
  ];

  for (const item of menuList) {
    const existing = await prisma.menu.findFirst({
      where: { namaMenu: item.namaMenu },
    });
    if (!existing) {
      await prisma.menu.create({ data: item });
    }
  }

  console.log("✅ Seeding berhasil diselesaikan!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
