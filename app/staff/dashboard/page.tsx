import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageShell from "@/components/landing/PageShell";
import TombolAksiStaf from "@/components/staff/TombolAksiStaff";

// Helper Tampilan

const fontJudul = "font-[family-name:var(--font-baloo)]";
const tombolOranye =
"rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_16px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";

const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
});

const formatTanggal = (d: Date) =>
    d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    });

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

// Kartu Reservasi versi Staf

type ReservasiLengkap = Awaited<ReturnType<typeof ambilSemuaReservasiStaf>>[number];

function KartuReservasiStaf({ r }: { r: ReservasiLengkap }) {
    const status = STATUS_RESERVASI[r.statusReservasi as keyof typeof STATUS_RESERVASI] || STATUS_RESERVASI.MENUNGGU_KONFIRMASI;
    const bayar = STATUS_PEMBAYARAN[r.statusPembayaran as keyof typeof STATUS_PEMBAYARAN] || STATUS_PEMBAYARAN.BELUM_BAYAR;

    return (
    <article className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)] sm:p-7">
        <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
            <div className="flex items-center gap-2">
            <h3 className={`${fontJudul} text-lg font-bold text-neutral-900`}>
                {r.user?.nama || "Pelanggan Anonim"}
            </h3>
            {r.user?.noHp && (
                <span className="text-xs font-medium text-neutral-500">({r.user.noHp})</span>
            )}
            </div>
            <p className="mt-0.5 text-sm text-neutral-500">
            {formatTanggal(r.tanggal)} · {r.jamMulai}–{r.jamSelesai} · Meja {r.meja.nomorMeja} ({r.meja.lokasiArea}) · {r.jumlahTamu} tamu
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
            <span className="font-semibold text-neutral-700">Catatan pelanggan:</span> {r.catatan}
        </p>
        )}

        <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-100 pt-4">
        <p className="text-sm text-neutral-500">
            Total{" "}
            <span className={`${fontJudul} text-xl font-extrabold tabular-nums text-neutral-900`}>
            {rupiah.format(Number(r.totalBayar))}
            </span>
        </p>
        <TombolAksiStaf
            reservasiId={r.id}
            statusSaatIni={r.statusReservasi}
            statusPembayaran={r.statusPembayaran}
        />
        </footer>
    </article>
    );
}


// Data Fetching Staf

function ambilSemuaReservasiStaf() {
return prisma.reservasi.findMany({
    orderBy: [{ tanggal: "desc" }, { jamMulai: "asc" }],
    include: {
        user: { select: { nama: true, noHp: true, email: true } },
        meja: { select: { nomorMeja: true, lokasiArea: true } },
        detailMenu: {
        orderBy: { createdAt: "asc" },
        include: { menu: { select: { namaMenu: true } } },
        },
    },
    });
}

// Konten Dashboard Staf

async function KontenDashboardStaf() {
    const user = await getCurrentUser();
    if (!user || (user.role !== "STAF" && user.role !== "ADMIN")) {
    redirect("/login?callbackUrl=%2Fstaff%2Fdashboard");
    }

    const semua = await ambilSemuaReservasiStaf();
    const hariIni = hariIniWIB();
    const tanggalStr = (r: ReservasiLengkap) => r.tanggal.toISOString().slice(0, 10);

  // Filter reservasi hari ini & akan datang
    const reservasiHariIni = semua.filter((r) => tanggalStr(r) === hariIni);
    const reservasiMendatang = semua.filter((r) => tanggalStr(r) > hariIni);
    const riwayatLama = semua.filter((r) => tanggalStr(r) < hariIni);

    return (
    <>
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <p className="text-lg font-semibold text-neutral-900">
            Panel Staf Restoran <span aria-hidden>🧑‍🍳</span>
            </p>
            <p className="text-sm text-neutral-500">Petugas: {user.nama}</p>
        </div>
        <Link href="/staff/cashier" className={tombolOranye}>
            Buka Mesin Kasir 💸
        </Link>
        </div>

        {semua.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-amber-300 bg-white px-6 py-14 text-center">
            <span aria-hidden className="text-4xl">📋</span>
            <p className={`${fontJudul} mt-3 text-xl font-bold text-neutral-900`}>Belum ada data reservasi</p>
            <p className="mt-1 text-sm text-neutral-500">Sistem belum menerima reservasi masuk dari pelanggan.</p>
        </div>
        ) : (
        <div className="mt-10 space-y-12">
          {/* Hari Ini */}
            <section aria-labelledby="judul-hari-ini">
            <h2 id="judul-hari-ini" className={`${fontJudul} mb-4 text-2xl font-bold text-neutral-900`}>
                Reservasi Hari Ini ({reservasiHariIni.length})
            </h2>
            {reservasiHariIni.length === 0 ? (
                <p className="rounded-2xl bg-white px-5 py-6 text-sm text-neutral-500 shadow-sm ring-1 ring-amber-100">
                Tidak ada jadwal reservasi untuk hari ini.
                </p>
            ) : (
                <div className="space-y-4">
                {reservasiHariIni.map((r) => (
                    <KartuReservasiStaf key={r.id} r={r} />
                ))}
                </div>
            )}
            </section>

          {/* Akan Datang */}
            {reservasiMendatang.length > 0 && (
            <section aria-labelledby="judul-mendatang">
                <h2 id="judul-mendatang" className={`${fontJudul} mb-4 text-2xl font-bold text-neutral-900`}>
                Reservasi Mendatang ({reservasiMendatang.length})
                </h2>
                <div className="space-y-4">
                {reservasiMendatang.map((r) => (
                    <KartuReservasiStaf key={r.id} r={r} />
                ))}
                </div>
            </section>
            )}

          {/* Riwayat Lampau */}
            {riwayatLama.length > 0 && (
            <section aria-labelledby="judul-lampau">
                <h2 id="judul-lampau" className={`${fontJudul} mb-4 text-2xl font-bold text-neutral-900`}>
                Riwayat Lampau ({riwayatLama.length})
                </h2>
                <div className="space-y-4">
                {riwayatLama.map((r) => (
                    <KartuReservasiStaf key={r.id} r={r} />
                ))}
                </div>
            </section>
            )}
        </div>
        )}
    </>
    );
}

// Page Export                                                                

export default function StaffDashboardPage() {
    return (
    <PageShell
        title="Dashboard Staf Operasional"
        subtitle="Monitoring reservasi masuk, alokasi kedatangan pelanggan, dan kasir."
        kembali={{ href: "/", label: "Kembali ke Beranda" }}
    >
        <div className="max-w-4xl">
        <Suspense fallback={<p className="text-sm text-neutral-500">Memuat data reservasi restoran…</p>}>
            <KontenDashboardStaf />
        </Suspense>
        </div>
    </PageShell>
    );
}