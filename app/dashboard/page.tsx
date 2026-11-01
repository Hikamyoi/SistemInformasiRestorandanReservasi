import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageShell from "@/components/landing/PageShell";
import CancelReservationButton from "@/components/CancelReservationButton";
import PushToggle from "@/components/PushToggle";

/* -------------------------------------------------------------------------- */
/*  Helper tampilan                                                           */
/* -------------------------------------------------------------------------- */

const fontJudul = "font-[family-name:var(--font-baloo)]";
const tombolOranye =
  "rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

// Kolom `tanggal` disimpan sebagai tengah malam UTC → tampilkan juga dengan UTC
const formatTanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

// "Hari ini" menurut zona waktu restoran (YYYY-MM-DD)
const hariIniWIB = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

const STATUS_RESERVASI = {
  MENUNGGU_KONFIRMASI: { label: "Menunggu konfirmasi", kelas: "bg-amber-100 text-amber-800" },
  DIKONFIRMASI: { label: "Dikonfirmasi", kelas: "bg-green-50 text-green-700" },
  SELESAI: { label: "Selesai", kelas: "bg-neutral-100 text-neutral-600" },
  DIBATALKAN: { label: "Dibatalkan", kelas: "bg-red-50 text-red-700" },
} as const;

const STATUS_PEMBAYARAN = {
  BELUM_BAYAR: { label: "Belum dibayar", kelas: "bg-neutral-100 text-neutral-600" },
  LUNAS: { label: "Lunas", kelas: "bg-green-50 text-green-700" },
  DIBATALKAN: { label: "Dibatalkan", kelas: "bg-red-50 text-red-700" },
} as const;

function Badge({ label, kelas }: { label: string; kelas: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${kelas}`}>
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kartu satu reservasi                                                      */
/* -------------------------------------------------------------------------- */

type ReservasiLengkap = Awaited<ReturnType<typeof ambilReservasi>>[number];

function KartuReservasi({ r, bisaDibatalkan }: { r: ReservasiLengkap; bisaDibatalkan: boolean }) {
  const status = STATUS_RESERVASI[r.statusReservasi];
  const bayar = STATUS_PEMBAYARAN[r.statusPembayaran];

  return (
    <article className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)] sm:p-7">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`${fontJudul} text-lg font-bold text-neutral-900`}>{formatTanggal(r.tanggal)}</h3>
          <p className="mt-0.5 text-sm text-neutral-500">
            {r.jamMulai}–{r.jamSelesai} · Meja {r.meja.nomorMeja} ({r.meja.lokasiArea}) · {r.jumlahTamu} tamu
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge {...status} />
          <Badge {...bayar} />
        </div>
      </header>

      {r.detailMenu.length > 0 && (
        <ul className="mt-4 divide-y divide-amber-100 rounded-2xl border border-amber-100 bg-[#FFFBF2] text-sm">
          {r.detailMenu.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-neutral-800">
                  {d.jumlah}× {d.menu.namaMenu}
                </p>
                {d.catatanKhusus && <p className="text-xs text-neutral-500">Catatan: {d.catatanKhusus}</p>}
              </div>
              <span className="shrink-0 tabular-nums text-neutral-700">{rupiah.format(Number(d.subtotal))}</span>
            </li>
          ))}
        </ul>
      )}

      {r.catatan && (
        <p className="mt-3 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-700">Catatan reservasi:</span> {r.catatan}
        </p>
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 pt-4">
        <p className="text-sm text-neutral-500">
          Total{" "}
          <span className={`${fontJudul} text-xl font-extrabold tabular-nums text-neutral-900`}>
            {rupiah.format(Number(r.totalBayar))}
          </span>
        </p>
        {bisaDibatalkan && <CancelReservationButton reservasiId={r.id} />}
      </footer>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

function ambilReservasi(userId: string) {
  return prisma.reservasi.findMany({
    where: { userId },
    orderBy: [{ tanggal: "desc" }, { jamMulai: "desc" }],
    include: {
      meja: { select: { nomorMeja: true, lokasiArea: true } },
      detailMenu: {
        orderBy: { createdAt: "asc" },
        include: { menu: { select: { namaMenu: true } } },
      },
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Konten (async) — dibungkus Suspense karena membaca cookie & database      */
/* -------------------------------------------------------------------------- */

async function KontenDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=%2Fdashboard");

  const semua = await ambilReservasi(user.userId);
  const hariIni = hariIniWIB();
  const tanggalStr = (r: ReservasiLengkap) => r.tanggal.toISOString().slice(0, 10);
  const aktif = (r: ReservasiLengkap) =>
    r.statusReservasi === "MENUNGGU_KONFIRMASI" || r.statusReservasi === "DIKONFIRMASI";

  // Akan datang: masih aktif & tanggalnya hari ini atau setelahnya (urut terdekat dulu)
  const akanDatang = semua.filter((r) => aktif(r) && tanggalStr(r) >= hariIni).reverse();
  const riwayat = semua.filter((r) => !(aktif(r) && tanggalStr(r) >= hariIni));

  const bisaDibatalkan = (r: ReservasiLengkap) => aktif(r) && r.statusPembayaran === "BELUM_BAYAR";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold text-neutral-900">
          Halo, {user.nama} <span aria-hidden>👋</span>
        </p>
        <Link href="/reservasi" className={tombolOranye}>
          Buat reservasi baru
        </Link>
      </div>

      <PushToggle />

      {semua.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-amber-300 bg-white px-6 py-14 text-center">
          <span aria-hidden className="text-4xl">🍽️</span>
          <p className={`${fontJudul} mt-3 text-xl font-bold text-neutral-900`}>Anda belum punya reservasi</p>
          <p className="mt-1 text-sm text-neutral-500">Pilih tanggal, meja, dan menu favorit Anda untuk memulai.</p>
          <Link href="/reservasi" className={`${tombolOranye} mt-5 inline-block`}>
            Reservasi sekarang
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          <section aria-labelledby="judul-akan-datang">
            <h2 id="judul-akan-datang" className={`${fontJudul} mb-4 text-2xl font-bold text-neutral-900`}>
              Akan datang ({akanDatang.length})
            </h2>
            {akanDatang.length === 0 ? (
              <p className="rounded-2xl bg-white px-5 py-6 text-sm text-neutral-500 shadow-sm ring-1 ring-amber-100">
                Tidak ada reservasi yang akan datang.
              </p>
            ) : (
              <div className="space-y-4">
                {akanDatang.map((r) => (
                  <KartuReservasi key={r.id} r={r} bisaDibatalkan={bisaDibatalkan(r)} />
                ))}
              </div>
            )}
          </section>

          {riwayat.length > 0 && (
            <section aria-labelledby="judul-riwayat">
              <h2 id="judul-riwayat" className={`${fontJudul} mb-4 text-2xl font-bold text-neutral-900`}>
                Riwayat ({riwayat.length})
              </h2>
              <div className="space-y-4">
                {riwayat.map((r) => (
                  <KartuReservasi key={r.id} r={r} bisaDibatalkan={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard Saya"
      subtitle="Pantau dan kelola reservasi Anda di sini."
      kembali={{ href: "/", label: "Kembali ke Beranda" }}
    >
      <div className="max-w-3xl">
        <Suspense fallback={<p className="text-sm text-neutral-500">Memuat reservasi Anda…</p>}>
          <KontenDashboard />
        </Suspense>
      </div>
    </PageShell>
  );
}
