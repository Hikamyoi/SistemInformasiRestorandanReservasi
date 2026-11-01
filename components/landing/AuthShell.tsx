import Link from "next/link";
import { Baloo_2, Poppins } from "next/font/google";
import Piring from "@/components/landing/Piring";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

const fontJudul = "font-[family-name:var(--font-baloo)]";

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
          <Link href="/" className={`${fontJudul} flex items-center gap-2 text-xl font-bold`}>
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-base">
              🍴
            </span>
            RestoReserve
          </Link>

          <h1 className={`${fontJudul} mt-10 text-4xl font-extrabold leading-tight`}>{title}</h1>
          <p className="mb-8 mt-2 text-sm leading-6 text-neutral-500">{subtitle}</p>

          {children}
        </div>
      </main>

      <aside
        aria-hidden
        className="relative hidden items-center justify-center overflow-hidden bg-amber-50 lg:flex"
      >
        <div className="absolute h-[34rem] w-[34rem] rounded-full bg-amber-100/80" />
        <div className="absolute right-10 top-12 h-28 w-28 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
        <div className="absolute bottom-12 left-10 h-28 w-28 bg-[radial-gradient(#f59e0b66_1.5px,transparent_1.5px)] [background-size:10px_10px]" />

        <div className="relative w-[22rem] text-center">
          <Piring nama="Hidangan" className="mx-auto w-72" />
          <p className={`${fontJudul} mt-10 text-3xl font-bold leading-tight`}>Meja Anda sudah menunggu.</p>
          <p className="mt-2 text-sm text-neutral-500">Pesan meja dan menu favorit, datang tanpa antre.</p>
        </div>
      </aside>
    </div>
  );
}
