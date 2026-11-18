// prisma/seed.ts (Jalankan via: npx prisma db seed atau npx tsx prisma/seed.ts)
import {
  PrismaClient,
  Role,
  StatusMeja,
  StatusReservasi,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Elevenicious] Memulai proses seeding database...");

  // 1. Hash Password Default: "Password123!"
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Password123!", salt);

  // 2. SEED USERS (Admin, Staf Kasir, Pelanggan Terdaftar)
  console.log("👤 Seeding Data Pengguna (Users)...");
  const admin = await prisma.user.upsert({
    where: { email: "admin@resto.com" },
    update: {},
    create: {
      nama: "Admin Elevenicious (Budi Santoso)",
      email: "admin@resto.com",
      passwordHash: passwordHash,
      role: Role.ADMIN,
      noHp: "081234567890",
    },
  });

  const staf = await prisma.user.upsert({
    where: { email: "staf@resto.com" },
    update: {},
    create: {
      nama: "Staf Kasir (Siti Rahma)",
      email: "staf@resto.com",
      passwordHash: passwordHash,
      role: Role.STAF,
      noHp: "081234567891",
    },
  });

  const pelanggan = await prisma.user.upsert({
    where: { email: "andi@gmail.com" },
    update: {},
    create: {
      nama: "Andi Wijaya",
      email: "andi@gmail.com",
      passwordHash: passwordHash,
      role: Role.PELANGGAN,
      noHp: "081234567892",
    },
  });

  // 3. SEED MEJA DENGAN RUANGAN, VIEW MEJA & KOORDINAT DENAH (posisiX & posisiY)
  console.log(
    "🪑 Seeding Meja berdasarkan Ruangan, View & Posisi Denah Visual...",
  );
  const mejaList = [
    // Area INDOOR NON SMOKING
    {
      nomorMeja: "IN-01",
      kapasitas: 2,
      status: StatusMeja.TERSEDIA,
      ruangan: "INDOOR_NON_SMOKING",
      viewMeja: "Dekat Jendela (Street View)",
      posisiX: 80,
      posisiY: 80,
      lokasiArea: "Indoor Dekat Jendela",
    },
    {
      nomorMeja: "IN-02",
      kapasitas: 4,
      status: StatusMeja.TERSEDIA,
      ruangan: "INDOOR_NON_SMOKING",
      viewMeja: "Tengah Ruangan (Hall Utama)",
      posisiX: 240,
      posisiY: 80,
      lokasiArea: "Indoor Hall Utama",
    },
    {
      nomorMeja: "IN-03",
      kapasitas: 4,
      status: StatusMeja.TERSEDIA,
      ruangan: "INDOOR_NON_SMOKING",
      viewMeja: "Tengah Ruangan (Dekat Barista)",
      posisiX: 400,
      posisiY: 80,
      lokasiArea: "Indoor Hall Utama",
    },
    {
      nomorMeja: "IN-04",
      kapasitas: 6,
      status: StatusMeja.TERSEDIA,
      ruangan: "INDOOR_NON_SMOKING",
      viewMeja: "Sudut Keluarga (Area Tenang)",
      posisiX: 240,
      posisiY: 220,
      lokasiArea: "Indoor Family Table",
    },

    // Area OUTDOOR SMOKING
    {
      nomorMeja: "OUT-01",
      kapasitas: 2,
      status: StatusMeja.TERSEDIA,
      ruangan: "OUTDOOR_SMOKING",
      viewMeja: "Dekat Taman (Garden View)",
      posisiX: 80,
      posisiY: 80,
      lokasiArea: "Outdoor Garden Breeze",
    },
    {
      nomorMeja: "OUT-02",
      kapasitas: 4,
      status: StatusMeja.TERSEDIA,
      ruangan: "OUTDOOR_SMOKING",
      viewMeja: "Area Kanopi (Semi-Terbuka)",
      posisiX: 240,
      posisiY: 80,
      lokasiArea: "Outdoor Canopy Area",
    },
    {
      nomorMeja: "OUT-03",
      kapasitas: 6,
      status: StatusMeja.TERSEDIA,
      ruangan: "OUTDOOR_SMOKING",
      viewMeja: "Teras Senja (Outdoor Breeze)",
      posisiX: 400,
      posisiY: 80,
      lokasiArea: "Outdoor Terrace Garden",
    },

    // Area VIP NON SMOKING
    {
      nomorMeja: "VIP-01",
      kapasitas: 8,
      status: StatusMeja.TERSEDIA,
      ruangan: "VIP_NON_SMOKING",
      viewMeja: "Private VIP Room (Eksklusif)",
      posisiX: 180,
      posisiY: 150,
      lokasiArea: "Private VIP Room Senja",
    },
  ];

  const createdMejaMap: Record<string, string> = {};
  for (const m of mejaList) {
    const item = await prisma.meja.upsert({
      where: { nomorMeja: m.nomorMeja },
      update: {
        kapasitas: m.kapasitas,
        status: m.status,
        ruangan: m.ruangan,
        viewMeja: m.viewMeja,
        posisiX: m.posisiX,
        posisiY: m.posisiY,
        lokasiArea: m.lokasiArea,
      },
      create: m,
    });
    createdMejaMap[m.nomorMeja] = item.id;
  }

  // 4. SEED KATEGORI MENU
  console.log("📂 Seeding 5 Kategori Menu...");
  const kategoriList = [
    { namaKategori: "Makanan Utama", urutan: 1 },
    { namaKategori: "Makanan Pembuka", urutan: 2 },
    { namaKategori: "Minuman Segar", urutan: 3 },
    { namaKategori: "Kopi & Teh", urutan: 4 },
    { namaKategori: "Dessert & Penutup", urutan: 5 },
  ];

  const createdKategori: Record<string, string> = {};
  for (const kat of kategoriList) {
    const k = await prisma.kategoriMenu.upsert({
      where: { namaKategori: kat.namaKategori },
      update: { urutan: kat.urutan },
      create: kat,
    });
    createdKategori[kat.namaKategori] = k.id;
  }

  // 5. SEED MENU DENGAN isPopuler
  console.log("🍽️ Seeding Menu Hidangan dengan flag isPopuler...");
  const menuList = [
    {
      kategoriId: createdKategori["Makanan Utama"],
      namaMenu: "Grilled Salmon Lemon Butter",
      harga: 85000,
      fotoUrl:
        "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600",
      deskripsi:
        "Fillet salmon panggang segar dengan saus mentega lemon dan baby potatoes.",
      statusKetersediaan: true,
      isPopuler: true,
    },
    {
      kategoriId: createdKategori["Makanan Utama"],
      namaMenu: "Nasi Goreng Wagyu Spesial",
      harga: 55000,
      fotoUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600",
      deskripsi:
        "Nasi goreng rempah nusantara dengan potongan daging wagyu lembut dan telur mata sapi.",
      statusKetersediaan: true,
      isPopuler: true,
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
      isPopuler: true,
    },
    {
      kategoriId: createdKategori["Minuman Segar"],
      namaMenu: "Lychee Iced Tea Refresher",
      harga: 20000,
      fotoUrl:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
      deskripsi: "Teh melati dingin harum dengan buah leci segar pilihan.",
      statusKetersediaan: true,
      isPopuler: true,
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
      isPopuler: true,
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
      isPopuler: false,
    },
  ];

  for (const item of menuList) {
    const existing = await prisma.menu.findFirst({
      where: { namaMenu: item.namaMenu },
    });
    if (existing) {
      await prisma.menu.update({
        where: { id: existing.id },
        data: item,
      });
    } else {
      await prisma.menu.create({ data: item });
    }
  }

  // 6. SEED CONTOH RESERVASI (Member Terdaftar & Tamu Guest Checkout)
  console.log("📋 Seeding Contoh Reservasi (Member & Guest Checkout)...");
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  // A. Reservasi dari Pelanggan Terdaftar
  await prisma.reservasi.upsert({
    where: { kodeBooking: "ELV-20261113-M01" },
    update: {},
    create: {
      kodeBooking: "ELV-20261113-M01",
      userId: pelanggan.id,
      mejaId: createdMejaMap["IN-02"] || Object.values(createdMejaMap)[0],
      namaPemesan: "Andi Wijaya",
      noHp: "081234567892",
      tanggal: targetDate,
      jamMulai: new Date("1970-01-01T12:00:00Z"),
      jamSelesai: new Date("1970-01-01T14:00:00Z"),
      jumlahTamu: 4,
      statusReservasi: StatusReservasi.DIKONFIRMASI,
      statusPembayaran: "LUNAS",
      totalBayar: 140000,
      catatan: "Dekat jendela dan tidak terlalu dingin",
    },
  });

  // B. Reservasi Tamu / Guest (userId = null)
  await prisma.reservasi.upsert({
    where: { kodeBooking: "ELV-20261113-G02" },
    update: {},
    create: {
      kodeBooking: "ELV-20261113-G02",
      userId: null, // Guest checkout tanpa login!
      mejaId: createdMejaMap["OUT-01"] || Object.values(createdMejaMap)[1],
      namaPemesan: "Rina Marlina (Tamu)",
      noHp: "081987654321",
      tanggal: targetDate,
      jamMulai: new Date("1970-01-01T18:30:00Z"),
      jamSelesai: new Date("1970-01-01T20:30:00Z"),
      jumlahTamu: 2,
      statusReservasi: StatusReservasi.MENUNGGU_KONFIRMASI,
      statusPembayaran: "BELUM_BAYAR",
      totalBayar: 77000,
      catatan: "Outdoor area, perayaan ulang tahun kecil",
    },
  });

  console.log("✅ Seeding database Elevenicious selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
