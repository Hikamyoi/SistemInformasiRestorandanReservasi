import { Suspense } from "react";
import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { keluar } from "@/lib/auth-actions";
import { JAM_BUKA, JAM_TUTUP } from "@/lib/validations/reservasi";
import Piring from "@/components/landing/Piring";
import { PopularDishes, MenuTabs, type ItemMenu } from "@/components/landing/MenuSections";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

const judul = "font-[family-name:var(--font-baloo)]";
const tombolOranye =
  "rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";
const tombolGaris =
  "rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-amber-500 hover:text-amber-600";

const LAYANAN = [
  { ikon: "🗓️", nama: "Reservasi Online" },
  { ikon: "🍽️", nama: "Pre-order Menu" },
  { ikon: "🪑", nama: "Pilih Area Duduk" },
  { ikon: "🔔", nama: "Notifikasi Status" },
  { ikon: "📋", nama: "Pantau di Dashboard" },
  { ikon: "↩️", nama: "Pembatalan Mudah" },
];

/* -------------------------------------------------------------------------- */
/*  Navigasi (status login dibaca dari cookie → Suspense)                     */
/* -------------------------------------------------------------------------- */

async function TautanAkun() {
  const user = await getCurrentUser();
  const tautan = "text-sm font-medium text-neutral-700 hover:text-amber-600";

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden max-w-[9rem] truncate text-sm text-neutral-500 xl:inline">Halo, {user.nama}</span>
        <Link href="/dashboard" className={tautan}>Dashboard</Link>
        <form action={keluar}>
          <button type="submit" className={`${tautan} hover:text-red-600`}>Keluar</button>
        </form>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className={tautan}>Masuk</Link>
      <Link href="/daftar" className={tautan}>Daftar</Link>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Isi halaman yang bergantung pada database                                 */
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
    }))
  );
  const namaKategori = kategori.filter((k) => k.menus.length > 0).map((k) => k.namaKategori);

  // Menu populer: yang tersedia, utamakan yang punya foto
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
          <h1 className={`${judul} text-5xl font-extrabold leading-[1.1] text-neutral-900 sm:text-6xl`}>
            Kami Sajikan Rasa yang Anda Suka <span aria-hidden>😋</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-neutral-500">
            Pesan meja dan menu favorit dari rumah, lalu datang tanpa antre. Pilih jadwal dan tempat duduk,
            kami siapkan sisanya.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#menu" className={tombolOranye}>Lihat Menu</a>
            <Link href="/reservasi" className={tombolGaris}>Reservasi Meja</Link>
          </div>
          <p className="mt-5 text-xs text-neutral-400">Buka setiap hari pukul {JAM_BUKA}–{JAM_TUTUP}</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div aria-hidden className="absolute inset-[6%] rounded-full bg-amber-100/70" />
          <div
            aria-hidden
            className="absolute -right-2 top-2 h-24 w-24 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]"
          />
          <Piring foto={hero?.foto} nama={hero?.nama ?? "Hidangan"} className="relative mx-auto w-[78%]" />

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

      {/* -------------------------- Menu populer -------------------------- */}
      <PopularDishes items={populer} />

      {/* ----------------------------- Layanan ---------------------------- */}
      <section id="layanan" className="mx-auto grid max-w-6xl scroll-mt-6 items-center gap-12 px-5 py-14 md:grid-cols-2">
        <div className="mx-auto grid aspect-square w-full max-w-sm grid-cols-2 gap-1 overflow-hidden rounded-full bg-white p-2 shadow-[0_18px_40px_-12px_rgba(180,110,0,0.35)] ring-1 ring-amber-100">
          {[0, 1, 2, 3].map((i) => {
            const m = berfoto[i];
            return m?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={m.foto} alt={m.nama} className="h-full w-full object-cover" />
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
          <h2 className={`${judul} text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl`}>
            Lebih dari Sekadar Tempat Makan
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
            Dari memilih meja sampai memantau status reservasi, semuanya bisa Anda atur sendiri lewat satu akun.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {LAYANAN.map((l) => (
              <li key={l.nama} className="flex items-center gap-3 text-sm font-medium text-neutral-800">
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
                  {l.ikon}
                </span>
                {l.nama}
              </li>
            ))}
          </ul>
          <Link href="/reservasi" className={`${tombolOranye} mt-8 inline-block`}>Mulai Reservasi</Link>
        </div>
      </section>

      {/* ------------------------- Menu per kategori ---------------------- */}
      <MenuTabs kategori={namaKategori} items={items} />

      {/* ------------------------------- CTA ------------------------------ */}
      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid items-center gap-8 rounded-[2rem] bg-amber-50 p-8 sm:p-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className={`${judul} text-3xl font-bold leading-tight text-neutral-900 sm:text-4xl`}>
              Ada Rencana Makan Malam Hari Ini? Reservasi Meja Anda
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-neutral-500">
              Amankan meja favorit Anda sekarang. Hanya butuh beberapa menit, dan status reservasi bisa dipantau kapan saja.
            </p>
            <Link href="/reservasi" className={`${tombolOranye} mt-7 inline-block`}>Buat Reservasi</Link>
          </div>
          <div className="relative mx-auto w-full max-w-[16rem]">
            <div aria-hidden className="absolute inset-[-8%] rounded-full bg-amber-200/60" />
            <Piring foto={cta?.foto} nama={cta?.nama ?? "Hidangan"} className="relative w-full" />
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <div
      className={`${baloo.variable} ${poppins.variable} min-h-screen bg-[#FFFBF2] text-neutral-900`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className={`${judul} flex items-center gap-2 text-xl font-bold`}>
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-base">🍴</span>
          RestoReserve
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-7 text-xs font-medium text-neutral-600 md:flex">
          <a href="#layanan" className="hover:text-amber-600">Layanan</a>
          <a href="#menu" className="hover:text-amber-600">Menu</a>
          <a href="#info" className="hover:text-amber-600">Jam Buka</a>
        </nav>

        <div className="flex items-center gap-4">
          <Suspense fallback={<span className="inline-block h-5 w-28" />}>
            <TautanAkun />
          </Suspense>
          <Link href="/reservasi" className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600">
            Reservasi Meja
          </Link>
        </div>
      </header>

      <Suspense fallback={<p className="px-5 py-24 text-center text-sm text-neutral-500">Menyiapkan hidangan…</p>}>
        <IsiHalaman />
      </Suspense>

      <footer id="info" className="mt-6 border-t border-amber-100 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:grid-cols-3">
          <div>
            <p className={`${judul} flex items-center gap-2 text-lg font-bold`}>
              <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm">🍴</span>
              RestoReserve
            </p>
            <p className="mt-3 max-w-xs text-xs leading-6 text-neutral-500">
              Sistem informasi restoran dan reservasi meja secara online.
            </p>
          </div>
          <div>
            <p className="font-semibold">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-xs text-neutral-500">
              <li><a href="#layanan" className="hover:text-amber-600">Layanan</a></li>
              <li><a href="#menu" className="hover:text-amber-600">Menu</a></li>
              <li><Link href="/reservasi" className="hover:text-amber-600">Reservasi</Link></li>
              <li><Link href="/daftar" className="hover:text-amber-600">Buat akun</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold">Jam buka</p>
            <p className="mt-3 text-xs leading-6 text-neutral-500">
              Setiap hari
              <br />
              {JAM_BUKA}–{JAM_TUTUP}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
