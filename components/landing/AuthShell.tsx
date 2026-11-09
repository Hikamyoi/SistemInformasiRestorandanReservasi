import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";
import Piring from "@/components/landing/Piring";

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

const fontJudul = "font-[family-name:var(--font-baloo)]";

/* -------------------------------------------------------------------------- */
/*  Logo Vektor Minimalis Elevenicious (Angka 11 + Garpu & Pisau)             */
/* -------------------------------------------------------------------------- */
function LogoElevenicious() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 p-1.5 shadow-sm transition-transform hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-label="Logo Elevenicious"
        >
          {/* Angka 1: Siluet Garpu */}
          <g fill="#FFFFFF">
            <path d="M35 18V38C35 41.5 37.5 44 41 45V80H45V45C48.5 44 51 41.5 51 38V18H48V34H46V18H44V34H42V18H39V34H37V18H35Z" />
            <path d="M36 40L26 47V53L36 46V40Z" />
          </g>
          {/* Angka 1: Siluet Pisau */}
          <g fill="#FFFFFF">
            <path d="M57 18H62V42L68 56C68 68 63 80 57 80V18Z" />
            <path d="M57 40L48 47V53L57 46V40Z" />
          </g>
        </svg>
      </div>
      <span
        className={`${fontJudul} text-xl font-extrabold tracking-tight text-neutral-900 leading-none`}
      >
        Eleven<span className="text-amber-500">icious</span>
      </span>
    </div>
  );
}

/** Kerangka halaman masuk/daftar: formulir di kiri, piring bundar dekoratif di kanan. */
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${baloo.variable} ${poppins.variable} grid min-h-screen bg-[#FFFBF2] text-neutral-900 lg:grid-cols-2`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <main className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* 1. Tombol Kembali ke Beranda */}
          <Link
            href="/"
            className="group mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition-all hover:border-amber-400 hover:text-amber-600"
          >
            <span className="transition-transform group-hover:-translate-x-1">
              &larr;
            </span>
            <span>Kembali ke Beranda</span>
          </Link>

          {/* 2. Logo Baru Elevenicious */}
          <div>
            <Link href="/" className="inline-block">
              <LogoElevenicious />
            </Link>
          </div>

          {/* 3. Judul & Subjudul */}
          <h1
            className={`${fontJudul} mt-8 text-4xl font-extrabold leading-tight`}
          >
            {title}
          </h1>
          <p className="mb-8 mt-2 text-sm leading-6 text-neutral-500">
            {subtitle}
          </p>

          {/* 4. Form Konten (Login / Register) */}
          {children}
        </div>
      </main>

      {/* Sisi Kanan: Ilustrasi Piring & Meja */}
      <aside
        aria-hidden
        className="relative hidden items-center justify-center overflow-hidden bg-amber-50 lg:flex"
      >
        <div className="absolute h-[34rem] w-[34rem] rounded-full bg-amber-100/80" />
        <div className="absolute right-10 top-12 h-28 w-28 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
        <div className="absolute bottom-12 left-10 h-28 w-28 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]" />

        <div className="relative w-[22rem] text-center">
          <Piring nama="Hidangan" className="mx-auto w-72" />
          <p className={`${fontJudul} mt-10 text-3xl font-bold leading-tight`}>
            Meja Anda sudah menunggu.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Pesan meja dan menu favorit, datang tanpa antre.
          </p>
        </div>
      </aside>
    </div>
  );
}
