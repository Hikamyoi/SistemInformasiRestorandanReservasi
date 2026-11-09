import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";

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

/** Kerangka halaman biasa: header logo + navigasi, tautan kembali (opsional), judul, lalu isi halaman. */
export default function PageShell({
  title,
  subtitle,
  kembali,
  children,
}: {
  title: string;
  subtitle?: string;
  kembali?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${baloo.variable} ${poppins.variable} min-h-screen bg-[#FFFBF2] text-neutral-900`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        {/* Logo Resmi Elevenicious */}
        <Link href="/" className="inline-flex items-center">
          <LogoElevenicious />
        </Link>
        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-6 text-xs font-semibold text-neutral-600"
        >
          <Link href="/" className="transition-colors hover:text-amber-600">
            Beranda
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-amber-600"
          >
            Dashboard
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-4">
        {kembali && (
          <Link
            href={kembali.href}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm ring-1 ring-amber-100 transition-colors hover:text-amber-600"
          >
            <span aria-hidden>←</span>
            {kembali.label}
          </Link>
        )}
        <h1
          className={`${fontJudul} text-3xl font-extrabold leading-tight text-neutral-900 sm:text-4xl`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mb-8 mt-2 text-sm text-neutral-500">{subtitle}</p>
        )}
        {children}
      </main>
    </div>
  );
}
