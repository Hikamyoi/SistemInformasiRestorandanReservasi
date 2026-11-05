import { Suspense } from "react";
import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { JAM_BUKA, JAM_TUTUP } from "@/lib/validations/reservasi";
import Navbar from "@/components/landing/Navbar";
import Piring from "@/components/landing/Piring";
import {
  PopularDishes,
  MenuTabs,
  type ItemMenu,
} from "@/components/landing/MenuSections";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

const judul = "font-[family-name:var(--font-baloo)]";
const tombolOranye =
  "rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";

const LAYANAN = [
  { ikon: "🗓️", nama: "Reservasi Online" },
  { ikon: "🍽️", nama: "Pre-order Menu" },
  { ikon: "🪑", nama: "Pilih Area Duduk" },
  { ikon: "🔔", nama: "Notifikasi Status" },
  { ikon: "📋", nama: "Pantau di Dashboard" },
  { ikon: "↩️", nama: "Pembatalan Mudah" },
];

/* -------------------------------------------------------------------------- */
/*  Wrapper Header Asinkron                                                   */
/* -------------------------------------------------------------------------- */

async function HeaderNav() {
  const user = await getCurrentUser();
  const userData = user
    ? { userId: user.userId, nama: user.nama, role: user.role }
    : null;
  return <Navbar user={userData} />;
}

/* -------------------------------------------------------------------------- */
/*  Isi Halaman Landing                                                       */
/* -------------------------------------------------------------------------- */

async function IsiHalaman() {
  const kategori = await prisma.kategoriMenu.findMany({
    orderBy: { urutan: "asc" },
    include: { menus: { orderBy: { namaMenu: "asc" } } },
  });

  const items: ItemMenu[] = kategori.flatMap((k) =>
    k.menus.map((m) => ({
      id: m.id,
      nama: m.namaMenu,
      harga: Number(m.harga),
      foto: m.fotoUrl,
      deskripsi: m.deskripsi,
      tersedia: m.statusKetersediaan,
      kategori: k.namaKategori,
    })),
  );
  const namaKategori = kategori
    .filter((k) => k.menus.length > 0)
    .map((k) => k.namaKategori);

  const populer = items
    .filter((i) => i.tersedia)
    .sort((a, b) => Number(Boolean(b.foto)) - Number(Boolean(a.foto)))
    .slice(0, 8);

  const berfoto = items.filter((i) => i.foto);
  const hero = berfoto[0] ?? items[0];
  const cta = berfoto[1] ?? hero;

  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-10 pt-8 lg:grid-cols-2 lg:pt-14">
        <div>
          <h1
            className={`${judul} text-4xl font-extrabold leading-[1.15] text-neutral-900 sm:text-5xl lg:text-6xl`}
          >
            Kami Sajikan Rasa yang Anda Suka <span aria-hidden>😋</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
            Pesan meja dan menu favorit dari rumah, lalu datang tanpa antre.
            Pilih jadwal dan tempat duduk, kami siapkan sisanya.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#menu" className={tombolOranye}>
              Lihat Menu
            </a>
          </div>
          <p className="mt-4 text-xs text-neutral-400">
            Buka setiap hari pukul {JAM_BUKA}–{JAM_TUTUP} WIB
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden
            className="absolute inset-[6%] rounded-full bg-amber-100/70"
          />
          <div
            aria-hidden
            className="absolute -right-2 top-2 h-24 w-24 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]"
          />
          <Piring
            foto={hero?.foto}
            nama={hero?.nama ?? "Hidangan"}
            className="relative mx-auto w-[78%]"
          />

          {namaKategori.length > 0 && (
            <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:absolute lg:right-0 lg:top-1/2 lg:mt-0 lg:-translate-y-1/2 lg:flex-col lg:flex-nowrap">
              {namaKategori.slice(0, 5).map((nama) => (
                <li key={nama}>
                  <a
                    href="#menu"
                    className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-xs font-medium text-neutral-700 shadow-[0_8px_20px_-10px_rgba(120,80,0,0.4)] hover:text-amber-600"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                      {nama.charAt(0).toUpperCase()}
                    </span>
                    {nama}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* -------------------------- Menu Populer -------------------------- */}
      <PopularDishes items={populer} />

      {/* ----------------------------- Layanan ---------------------------- */}
      <section
        id="layanan"
        className="mx-auto grid max-w-6xl scroll-mt-6 items-center gap-12 px-5 py-14 md:grid-cols-2"
      >
        <div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-2 gap-1 overflow-hidden rounded-full bg-white p-2 shadow-[0_18px_40px_-12px_rgba(180,110,0,0.35)] ring-1 ring-amber-100">
          {[0, 1, 2, 3].map((i) => {
            const m = berfoto[i];
            return m?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={m.foto}
                alt={m.nama}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                key={i}
                aria-hidden
                className={`flex items-center justify-center text-3xl ${i % 2 === 0 ? "bg-amber-100" : "bg-amber-200"}`}
              >
                🍴
              </div>
            );
          })}
        </div>

        <div>
          <h2
            className={`${judul} text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl`}
          >
            Lebih dari Sekadar Tempat Makan
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
            Dari memilih meja sampai memantau status reservasi, semuanya bisa
            Anda atur sendiri lewat satu akun.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {LAYANAN.map((l) => (
              <li
                key={l.nama}
                className="flex items-center gap-3 text-sm font-medium text-neutral-800"
              >
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm"
                >
                  {l.ikon}
                </span>
                {l.nama}
              </li>
            ))}
          </ul>
          <Link
            href="/reservasi"
            className={`${tombolOranye} mt-8 inline-block`}
          >
            Mulai Reservasi
          </Link>
        </div>
      </section>

      {/* ------------------------- Menu per Kategori ---------------------- */}
      <MenuTabs kategori={namaKategori} items={items} />

      {/* ------------------------------- CTA ------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-8 rounded-[2rem] bg-amber-50 p-8 sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2
              className={`${judul} text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl`}
            >
              Ada Rencana Makan Di Elevenicious Hari Ini? Reservasi Meja Anda
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
              Amankan meja favorit Anda sekarang. Hanya butuh beberapa menit,
              dan status reservasi bisa dipantau kapan saja.
            </p>
            <Link
              href="/reservasi"
              className={`${tombolOranye} mt-7 inline-block`}
            >
              Buat Reservasi
            </Link>
          </div>
          <div className="relative mx-auto w-full max-w-[16rem]">
            <div
              aria-hidden
              className="absolute inset-[-8%] rounded-full bg-amber-200/60"
            />
            <Piring
              foto={cta?.foto}
              nama={cta?.nama ?? "Hidangan"}
              className="relative w-full"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------- Kontak ----------------------------- */}
      <section
        id="kontak"
        className="mx-auto max-w-6xl scroll-mt-14 px-5 py-14"
      >
        <div className="text-center">
          <span className="rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            Hubungi Kami
          </span>
          <h2
            className={`${judul} mt-3 text-3xl font-extrabold text-neutral-900 sm:text-4xl`}
          >
            Kunjungi Restoran & Terhubung Bersama Kami
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-500">
            Ingin memesan meja khusus rombongan, konsultasi menu spesial, atau
            butuh bantuan reservasi? Tim kami siap melayani Anda.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kartu Alamat */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.2)] ring-1 ring-amber-100">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                📍
              </span>
              <h3
                className={`${judul} mt-4 text-lg font-bold text-neutral-900`}
              >
                Lokasi Restoran
              </h3>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                Jl. Raya Banaran, Sekaran, Kec. Gn. Pati, Kota Semarang, Jawa
                Tengah 50229
              </p>
            </div>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              Buka Google Maps &rarr;
            </a>
          </div>

          {/* Kartu WhatsApp */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.2)] ring-1 ring-amber-100">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                💬
              </span>
              <h3
                className={`${judul} mt-4 text-lg font-bold text-neutral-900`}
              >
                WhatsApp & Telp
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                Respon cepat reservasi & pertanyaan:
              </p>
              <p className="mt-1 text-sm font-bold text-neutral-800">
                +62 812-3456-7890
              </p>
              <p className="text-xs text-neutral-500">(021) 765-4321</p>
            </div>
            <a
              href="https://wa.me/6281234567890?text=Halo%20Elevenicious,%20saya%20ingin%20bertanya%20seputar%20reservasi"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-xs font-semibold text-green-600 hover:text-green-700"
            >
              Chat WhatsApp &rarr;
            </a>
          </div>

          {/* Kartu Email */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.2)] ring-1 ring-amber-100">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                ✉️
              </span>
              <h3
                className={`${judul} mt-4 text-lg font-bold text-neutral-900`}
              >
                Email Resmi
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                Layanan kerjasama & masukan pelanggan:
              </p>
              <p className="mt-1 text-sm font-bold text-neutral-800">
                halo@elevenicious.com
              </p>
              <p className="text-xs text-neutral-500">admin@resto.com</p>
            </div>
            <a
              href="mailto:halo@elevenicious.com"
              className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700"
            >
              Kirim Email &rarr;
            </a>
          </div>

          {/* Kartu Jam Operasional */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.2)] ring-1 ring-amber-100">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                ⏰
              </span>
              <h3
                className={`${judul} mt-4 text-lg font-bold text-neutral-900`}
              >
                Jam Buka
              </h3>
              <p className="mt-2 text-xs text-neutral-500">
                Dapur & pelayanan kami buka:
              </p>
              <p className="mt-1 text-sm font-bold text-neutral-800">
                Setiap Hari
              </p>
              <p className="text-xs text-neutral-500">
                {JAM_BUKA} – {JAM_TUTUP} WIB
              </p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Siap Menerima Tamu
            </span>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman Utama                                                             */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div
      className={`${baloo.variable} ${poppins.variable} min-h-screen bg-[#FFFBF2] text-neutral-900`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <Suspense fallback={<div className="h-16 bg-[#FFFBF2]" />}>
        <HeaderNav />
      </Suspense>

      <Suspense
        fallback={
          <p className="px-5 py-24 text-center text-sm text-neutral-500">
            Menyiapkan hidangan…
          </p>
        }
      >
        <IsiHalaman />
      </Suspense>

      <footer className="mt-12 border-t border-amber-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:grid-cols-3">
          {/* Logo & Brand Footer Elevenicious */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-500 p-1.5 shadow-sm">
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full"
                >
                  <g fill="#FFFFFF">
                    <path d="M35 18V38C35 41.5 37.5 44 41 45V80H45V45C48.5 44 51 41.5 51 38V18H48V34H46V18H44V34H42V18H39V34H37V18H35Z" />
                    <path d="M36 40L26 47V53L36 46V40Z" />
                  </g>
                  <g fill="#FFFFFF">
                    <path d="M57 18H62V42L68 56C68 68 63 80 57 80V18Z" />
                    <path d="M57 40L48 47V53L57 46V40Z" />
                  </g>
                </svg>
              </div>
              <span
                className={`${judul} text-xl font-extrabold tracking-tight text-neutral-900 leading-none`}
              >
                Eleven<span className="text-amber-500">icious</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-6 text-neutral-500">
              Pesan meja tanpa antre, nikmati hidangan istimewa hanya di
              Elevenicious.
            </p>
          </div>

          <div>
            <p className="font-semibold text-neutral-900">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-xs text-neutral-500">
              <li>
                <a
                  href="#layanan"
                  className="hover:text-amber-600 transition-colors"
                >
                  Layanan
                </a>
              </li>
              <li>
                <a
                  href="#menu"
                  className="hover:text-amber-600 transition-colors"
                >
                  Menu
                </a>
              </li>
              <li>
                <a
                  href="#kontak"
                  className="hover:text-amber-600 transition-colors"
                >
                  Kontak
                </a>
              </li>
              <li>
                <Link
                  href="/reservasi"
                  className="hover:text-amber-600 transition-colors"
                >
                  Reservasi Meja
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-neutral-900">Jam Operasional</p>
            <p className="mt-3 text-xs leading-6 text-neutral-500">
              Setiap hari
              <br />
              {JAM_BUKA}–{JAM_TUTUP} WIB
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
