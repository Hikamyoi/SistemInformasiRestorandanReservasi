import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

const fontJudul = "font-[family-name:var(--font-baloo)]";

/** Kerangka halaman biasa: header logo + navigasi, tautan kembali (opsional), judul, lalu isi halaman. */
export default function PageShell({
  title,
  subtitle,
  kembali,
  children,
}: {
  title: string;
  subtitle: string;
  kembali?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${baloo.variable} ${poppins.variable} min-h-screen bg-[#FFFBF2] text-neutral-900`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className={`${fontJudul} flex items-center gap-2 text-xl font-bold`}>
          <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-base">
            🍴
          </span>
          RestoReserve
        </Link>
        <nav aria-label="Navigasi utama" className="flex items-center gap-5 text-sm font-medium text-neutral-600">
          <Link href="/" className="hover:text-amber-600">Beranda</Link>
          <Link href="/dashboard" className="hover:text-amber-600">Dashboard</Link>
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
        <h1 className={`${fontJudul} text-4xl font-extrabold leading-tight`}>{title}</h1>
        <p className="mb-8 mt-2 text-sm text-neutral-500">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
