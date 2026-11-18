"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Baloo_2, Poppins } from "next/font/google";
import {
  Calendar,
  Clock,
  Users,
  UtensilsCrossed,
  User,
  Phone,
  QrCode,
  Building2,
  ArrowLeft,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Receipt,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import DenahMeja, {
  type MejaFloorplanItem,
  getKeteranganViewMeja,
  getLabelRuangan,
} from "@/components/DenahMeja";

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

interface MenuItem {
  id: string;
  namaMenu: string;
  harga: number;
  fotoUrl?: string | null;
  deskripsi?: string | null;
  isPopuler: boolean;
  kategori: string;
}

interface CartItem {
  menu: MenuItem;
  jumlah: number;
  catatanKhusus: string;
}

// Daftar lengkap pilihan jam kedatangan setiap 30 menit (10:00 s/d 21:00 WIB)
const SLOT_JAM_DATANG: string[] = [];
for (let h = 10; h <= 21; h++) {
  const hh = String(h).padStart(2, "0");
  SLOT_JAM_DATANG.push(`${hh}:00`);
  if (h < 21) {
    SLOT_JAM_DATANG.push(`${hh}:30`);
  }
}

// Daftar lengkap pilihan jam selesai setiap 30 menit (10:30 s/d 22:00 WIB)
const SLOT_JAM_TUTUP: string[] = [];
for (let h = 10; h <= 22; h++) {
  const hh = String(h).padStart(2, "0");
  if (h > 10) SLOT_JAM_TUTUP.push(`${hh}:00`);
  if (h < 22) SLOT_JAM_TUTUP.push(`${hh}:30`);
}

function keMenit(jamStr: string): number {
  const [h, m] = jamStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

function defaultJamSelesai(jamMulaiStr: string): string {
  const targetMenit = Math.min(keMenit(jamMulaiStr) + 120, 22 * 60);
  const hh = String(Math.floor(targetMenit / 60)).padStart(2, "0");
  const mm = String(targetMenit % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function HalamanReservasiPublik() {
  const router = useRouter();

  const [tanggal, setTanggal] = useState<string>("");
  const [minTanggal, setMinTanggal] = useState<string>("");
  const [jam, setJam] = useState<string>("12:00");
  const [jamSelesai, setJamSelesai] = useState<string>("14:00");
  const [jumlahTamu, setJumlahTamu] = useState<number>(2);

  const [daftarMeja, setDaftarMeja] = useState<MejaFloorplanItem[]>([]);
  const [loadingMeja, setLoadingMeja] = useState<boolean>(true);
  const [errorMeja, setErrorMeja] = useState<string | null>(null);
  const [selectedMejaId, setSelectedMejaId] = useState<string>("");

  const [daftarMenu, setDaftarMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [kategoriAktif, setKategoriAktif] = useState<string>("SEMUA");
  const [kataCariMenu, setKataCariMenu] = useState<string>("");
  const [keranjang, setKeranjang] = useState<Record<string, CartItem>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const [namaPemesan, setNamaPemesan] = useState<string>("");
  const [noHp, setNoHp] = useState<string>("");
  const [catatanReservasi, setCatatanReservasi] = useState<string>("");
  const [metodeBayar, setMetodeBayar] = useState<"QRIS" | "TRANSFER_VA">(
    "QRIS",
  );

  const [riwayatBookingLokal, setRiwayatBookingLokal] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const hariIni = new Date();
    const besok = new Date();
    besok.setDate(hariIni.getDate() + 1);
    setMinTanggal(hariIni.toISOString().split("T")[0]);
    setTanggal((prev) => prev || besok.toISOString().split("T")[0]);

    try {
      const savedList = localStorage.getItem("elevenicious_bookings");
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed)) {
          setRiwayatBookingLokal(parsed.slice(0, 3));
        }
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  useEffect(() => {
    let aktif = true;
    async function loadMenu() {
      setLoadingMenu(true);
      try {
        const res = await fetch("/api/menu");
        const json = await res.json();
        if (aktif && res.ok && json.success) {
          setDaftarMenu(json.data || []);
        }
      } catch {
        // Silent fallback
      } finally {
        if (aktif) setLoadingMenu(false);
      }
    }
    loadMenu();
    return () => {
      aktif = false;
    };
  }, []);

  // Opsi jam selesai hanya menampilkan jam yang lebih besar dari jam kedatangan
  const opsiJamSelesai = useMemo(
    () => SLOT_JAM_TUTUP.filter((s) => keMenit(s) > keMenit(jam)),
    [jam],
  );

  const handleUbahJamDatang = (jamBaru: string) => {
    setJam(jamBaru);
    if (keMenit(jamSelesai) <= keMenit(jamBaru)) {
      setJamSelesai(defaultJamSelesai(jamBaru));
    }
  };

  useEffect(() => {
    let aktif = true;
    async function loadMejaTersedia() {
      if (!tanggal || !jam || !jamSelesai) return;
      setLoadingMeja(true);
      setErrorMeja(null);
      try {
        const res = await fetch(
          `/api/meja/tersedia?tanggal=${encodeURIComponent(tanggal)}&jam=${encodeURIComponent(jam)}&jamSelesai=${encodeURIComponent(jamSelesai)}`,
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Gagal memuat ketersediaan meja.");
        }
        if (aktif) {
          const list: MejaFloorplanItem[] = json.data?.meja || [];
          setDaftarMeja(list);
          setSelectedMejaId((prevId) => {
            if (!prevId) return "";
            const masihValid = list.find(
              (m) =>
                m.id === prevId && m.isTersedia && m.kapasitas >= jumlahTamu,
            );
            return masihValid ? prevId : "";
          });
        }
      } catch (err: any) {
        if (aktif) setErrorMeja(err.message || "Gagal memuat data meja.");
      } finally {
        if (aktif) setLoadingMeja(false);
      }
    }
    loadMejaTersedia();
  }, [tanggal, jam, jamSelesai, jumlahTamu]);

  const daftarKategori = useMemo(() => {
    const unik = Array.from(new Set(daftarMenu.map((m) => m.kategori)));
    return ["SEMUA", ...unik];
  }, [daftarMenu]);

  const menuTersaring = useMemo(() => {
    return daftarMenu.filter((m) => {
      const cocokKategori =
        kategoriAktif === "SEMUA" || m.kategori === kategoriAktif;
      const cocokCari =
        !kataCariMenu.trim() ||
        m.namaMenu.toLowerCase().includes(kataCariMenu.toLowerCase());
      return cocokKategori && cocokCari;
    });
  }, [daftarMenu, kategoriAktif, kataCariMenu]);

  const mejaTerpilih = useMemo(
    () => daftarMeja.find((m) => m.id === selectedMejaId) || null,
    [daftarMeja, selectedMejaId],
  );

  const itemKeranjang = useMemo(() => Object.values(keranjang), [keranjang]);

  const totalBayar = useMemo(
    () =>
      itemKeranjang.reduce(
        (sum, item) => sum + item.menu.harga * item.jumlah,
        0,
      ),
    [itemKeranjang],
  );

  const totalQtyMenu = useMemo(
    () => itemKeranjang.reduce((sum, item) => sum + item.jumlah, 0),
    [itemKeranjang],
  );

  const ubahQtyMenu = (menu: MenuItem, delta: number) => {
    setKeranjang((prev) => {
      const existing = prev[menu.id];
      const nextQty = (existing?.jumlah || 0) + delta;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[menu.id];
        return copy;
      }
      return {
        ...prev,
        [menu.id]: {
          menu,
          jumlah: nextQty,
          catatanKhusus: existing?.catatanKhusus || "",
        },
      };
    });
  };

  const ubahCatatanMenu = (menuId: string, catatan: string) => {
    setKeranjang((prev) => {
      if (!prev[menuId]) return prev;
      return {
        ...prev,
        [menuId]: {
          ...prev[menuId],
          catatanKhusus: catatan,
        },
      };
    });
  };

  const handleBayarDanKonfirmasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedMejaId) {
      setSubmitError("Silakan pilih meja pada denah ruangan terlebih dahulu.");
      return;
    }
    if (!namaPemesan.trim()) {
      setSubmitError("Nama lengkap pemesan wajib diisi.");
      return;
    }
    if (!noHp.trim() || noHp.trim().length < 8) {
      setSubmitError("Nomor HP / WhatsApp yang valid wajib diisi.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        namaPemesan: namaPemesan.trim(),
        noHp: noHp.trim(),
        mejaId: selectedMejaId,
        tanggal,
        jam,
        jamSelesai,
        jumlahTamu,
        catatan: catatanReservasi.trim() || null,
        items: itemKeranjang.map((item) => ({
          menuId: item.menu.id,
          jumlah: item.jumlah,
          catatanKhusus: item.catatanKhusus.trim() || undefined,
        })),
      };

      const res = await fetch("/api/reservasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json.error || "Gagal memproses reservasi. Silakan coba lagi.",
        );
      }

      const kodeBooking: string = json.data?.kodeBooking;
      if (!kodeBooking) {
        throw new Error("Kode booking tidak diterima dari server.");
      }

      try {
        localStorage.setItem("elevenicious_last_booking", kodeBooking);
        const existingRaw = localStorage.getItem("elevenicious_bookings");
        const existingArr: string[] = existingRaw
          ? JSON.parse(existingRaw)
          : [];
        const updatedArr = [
          kodeBooking,
          ...existingArr.filter((k) => k !== kodeBooking),
        ].slice(0, 10);
        localStorage.setItem(
          "elevenicious_bookings",
          JSON.stringify(updatedArr),
        );
      } catch {
        // Abaikan jika browser memblokir storage
      }

      router.push(`/reservasi/${encodeURIComponent(kodeBooking)}`);
    } catch (err: any) {
      setSubmitError(err.message || "Terjadi kesalahan pada server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`${baloo.variable} ${poppins.variable} min-h-screen bg-[#FFFDF7] text-neutral-900`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-40 border-b border-amber-100 bg-[#FFFDF7]/95 backdrop-blur-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-500 p-1.5 shadow-sm">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
                aria-hidden="true"
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
            <span className="font-[family-name:var(--font-baloo)] text-xl font-extrabold tracking-tight text-neutral-900 leading-none">
              Eleven<span className="text-amber-500">icious</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link
              href="/"
              className="hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              Beranda
            </Link>
            <Link
              href="/reservasi"
              className="text-amber-600 font-semibold whitespace-nowrap"
            >
              Reservasi Meja
            </Link>
            <Link
              href="/login"
              className="hover:text-neutral-900 transition-colors whitespace-nowrap"
            >
              Masuk / Login
            </Link>
          </nav>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-neutral-700 hover:text-neutral-900 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
              Pesan Meja &amp; Menu Favorit Anda
            </h1>
            <p className="mt-1.5 text-sm text-neutral-600">
              Pilih jadwal kedatangan, tentukan posisi meja favorit pada denah
              interaktif, pre-order menu, dan selesaikan pembayaran dalam satu
              langkah.
            </p>
          </div>

          {riwayatBookingLokal.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-neutral-500 font-medium inline-flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5 text-amber-600" />
                Reservasi terakhir:
              </span>
              {riwayatBookingLokal.map((kode) => (
                <Link
                  key={kode}
                  href={`/reservasi/${encodeURIComponent(kode)}`}
                  className="font-mono font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2"
                >
                  {kode}
                </Link>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleBayarDanKonfirmasi}
          className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start"
        >
          <div className="lg:col-span-8 space-y-6">
            {/* LANGKAH 1 */}
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white tabular-nums">
                  1
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    Jadwal Kunjungan &amp; Jumlah Tamu
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Restoran buka setiap hari pukul 10:00–22:00 WIB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="tanggal"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Tanggal Kedatangan
                  </label>
                  <div className="relative">
                    <Calendar className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="tanggal"
                      type="date"
                      required
                      min={minTanggal || undefined}
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm font-medium text-neutral-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="jam"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Jam Kedatangan
                  </label>
                  <div className="relative">
                    <Clock className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="jam"
                      value={jam}
                      onChange={(e) => handleUbahJamDatang(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm font-medium text-neutral-900 tabular-nums focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {SLOT_JAM_DATANG.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} WIB
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="jamSelesai"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Jam Selesai
                  </label>
                  <div className="relative">
                    <Clock className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      id="jamSelesai"
                      value={jamSelesai}
                      onChange={(e) => setJamSelesai(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm font-medium text-neutral-900 tabular-nums focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {opsiJamSelesai.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot} WIB
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="jumlahTamu"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Jumlah Tamu
                  </label>
                  <div className="relative">
                    <Users className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="jumlahTamu"
                      type="number"
                      min={1}
                      max={12}
                      required
                      value={jumlahTamu}
                      onChange={(e) =>
                        setJumlahTamu(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm font-medium text-neutral-900 tabular-nums focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* LANGKAH 2 */}
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white tabular-nums">
                    2
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                      Pilih Ruangan &amp; Denah Meja
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Pilih zona Non-Smoking atau Smoking, lalu klik meja yang
                      masih tersedia.
                    </p>
                  </div>
                </div>
              </div>

              {errorMeja ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMeja}</span>
                </div>
              ) : (
                <DenahMeja
                  daftarMeja={daftarMeja}
                  selectedMejaId={selectedMejaId}
                  onSelectMeja={(meja) => setSelectedMejaId(meja.id)}
                  jumlahTamu={jumlahTamu}
                  loading={loadingMeja}
                />
              )}
            </section>

            {/* LANGKAH 3 */}
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white tabular-nums">
                    3
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                      Pre-Order Menu Makanan &amp; Minuman
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Hidangan disiapkan hangat saat Anda tiba di restoran.
                    </p>
                  </div>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari nama menu..."
                    value={kataCariMenu}
                    onChange={(e) => setKataCariMenu(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-neutral-100">
                {daftarKategori.map((kat) => (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => setKategoriAktif(kat)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                      kategoriAktif === kat
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    }`}
                  >
                    {kat === "SEMUA" ? "Semua Menu" : kat}
                  </button>
                ))}
              </div>

              {loadingMenu ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                  Memuat katalog menu...
                </div>
              ) : menuTersaring.length === 0 ? (
                <div className="py-10 text-center text-sm text-neutral-500">
                  Menu yang dicari tidak ditemukan.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {menuTersaring.map((menu) => {
                    const qty = keranjang[menu.id]?.jumlah || 0;
                    const showFallbackImg =
                      !menu.fotoUrl || brokenImages[menu.id];

                    return (
                      <div
                        key={menu.id}
                        className={`flex flex-col justify-between rounded-xl border p-3.5 transition ${
                          qty > 0
                            ? "border-amber-400 bg-amber-50/40"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex gap-3.5">
                          <div className="h-20 w-20 rounded-xl overflow-hidden bg-amber-50 border border-neutral-100 shrink-0 flex items-center justify-center">
                            {showFallbackImg ? (
                              <UtensilsCrossed className="h-6 w-6 text-amber-500" />
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={menu.fotoUrl!}
                                alt={menu.namaMenu}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setBrokenImages((prev) => ({
                                    ...prev,
                                    [menu.id]: true,
                                  }))
                                }
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                              <span>{menu.kategori}</span>
                              {menu.isPopuler && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                    Favorit
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-neutral-900 leading-snug mt-0.5">
                              {menu.namaMenu}
                            </h3>
                            {menu.deskripsi && (
                              <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                                {menu.deskripsi}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-neutral-900 tabular-nums">
                            {rupiah.format(menu.harga)}
                          </span>

                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => ubahQtyMenu(menu, 1)}
                              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Tambah
                            </button>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => ubahQtyMenu(menu, -1)}
                                className="h-7 w-7 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-100"
                                aria-label="Kurangi jumlah"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm font-bold text-neutral-900 tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => ubahQtyMenu(menu, 1)}
                                className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600"
                                aria-label="Tambah jumlah"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {qty > 0 && (
                          <input
                            type="text"
                            placeholder="Catatan khusus (mis. tidak pedas, es sedikit)"
                            value={keranjang[menu.id]?.catatanKhusus || ""}
                            onChange={(e) =>
                              ubahCatatanMenu(menu.id, e.target.value)
                            }
                            className="mt-2.5 w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* LANGKAH 4 */}
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white tabular-nums">
                  4
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    Data Diri Pemesan
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Digunakan untuk identifikasi kedatangan dan kode booking
                    Anda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="namaPemesan"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Nama Lengkap Pemesan{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="namaPemesan"
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={namaPemesan}
                      onChange={(e) => setNamaPemesan(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="noHp"
                    className="block text-xs font-semibold text-neutral-700 mb-1.5"
                  >
                    Nomor HP / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="noHp"
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      className="w-full rounded-xl border border-neutral-300 bg-white pl-9 pr-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 tabular-nums focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="catatanReservasi"
                  className="block text-xs font-semibold text-neutral-700 mb-1.5"
                >
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="catatanReservasi"
                  rows={2}
                  placeholder="Misal: Minta kursi bayi, perayaan ulang tahun, atau alergi makanan tertentu"
                  value={catatanReservasi}
                  onChange={(e) => setCatatanReservasi(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </section>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-neutral-900">
                  Ringkasan &amp; Pembayaran
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Konfirmasi pembayaran sekali jalan langsung berstatus LUNAS.
                </p>
              </div>

              <div className="space-y-2.5 text-sm border-y border-neutral-100 py-4">
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500">Jadwal</span>
                  <span className="font-semibold text-neutral-900 text-right tabular-nums">
                    {tanggal || "..."} · {jam} – {jamSelesai} WIB
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-neutral-500">Jumlah Tamu</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {jumlahTamu} orang
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-neutral-500">Meja</span>
                  {mejaTerpilih ? (
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">
                        Meja {mejaTerpilih.nomorMeja}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {getLabelRuangan(mejaTerpilih.ruangan)}
                      </p>
                      <p className="text-xs text-amber-700 font-medium inline-flex items-center justify-end gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {getKeteranganViewMeja(mejaTerpilih)}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-rose-600">
                      Belum dipilih
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 mb-2">
                  <span>Pesanan Menu ({totalQtyMenu} item)</span>
                </div>
                {itemKeranjang.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">
                    Belum ada menu dipilih (Anda juga bisa pesan nanti via
                    Add-On).
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {itemKeranjang.map(({ menu, jumlah, catatanKhusus }) => (
                      <li
                        key={menu.id}
                        className="flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-800 truncate">
                            {jumlah}× {menu.namaMenu}
                          </p>
                          {catatanKhusus && (
                            <p className="text-[11px] text-neutral-500 italic">
                              Catatan: {catatanKhusus}
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-neutral-900 tabular-nums shrink-0">
                          {rupiah.format(menu.harga * jumlah)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                <p className="text-xs font-semibold text-neutral-700">
                  Metode Pembayaran Instan
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetodeBayar("QRIS")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      metodeBayar === "QRIS"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    QRIS Instan
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodeBayar("TRANSFER_VA")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      metodeBayar === "TRANSFER_VA"
                        ? "border-amber-500 bg-amber-50 text-amber-800"
                        : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    Transfer VA
                  </button>
                </div>

                <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3 text-xs text-neutral-600">
                  {metodeBayar === "QRIS" ? (
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-white border border-neutral-200 flex items-center justify-center shrink-0">
                        <QrCode className="h-8 w-8 text-neutral-800" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-800">
                          QRIS Elevenicious Pay
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          Mendukung GoPay, OVO, DANA, ShopeePay &amp; Mobile
                          Banking.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="font-semibold text-neutral-800">
                        Virtual Account Otomatis
                      </p>
                      <p className="font-mono text-neutral-700 mt-0.5 tabular-nums">
                        BCA / Mandiri VA · 88011 0812 3456
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">
                  Total Pembayaran
                </span>
                <span className="text-xl font-extrabold text-neutral-900 tabular-nums">
                  {rupiah.format(totalBayar)}
                </span>
              </div>

              {submitError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loadingMeja}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-amber-500/20 hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memproses Pembayaran...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Bayar &amp; Konfirmasi Reservasi
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-neutral-500 leading-relaxed">
                Dengan mengklik konfirmasi, status reservasi langsung menjadi{" "}
                <strong className="text-neutral-700">LUNAS</strong> dan meja
                terkunci eksklusif untuk Anda.
              </p>
            </div>
          </aside>
        </form>
      </main>
    </div>
  );
}
