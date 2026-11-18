"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  MapPin,
  Eye,
  UtensilsCrossed,
  Plus,
  Minus,
  Copy,
  Check,
  Printer,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  X,
  Search,
  AlertCircle,
} from "lucide-react";
import { getKeteranganViewMeja, getLabelRuangan } from "@/components/DenahMeja";

interface DetailMenuItem {
  id: string;
  jumlah: number;
  subtotal: number | string;
  catatanKhusus?: string | null;
  menu: {
    id: string;
    namaMenu: string;
    harga: number | string;
    fotoUrl?: string | null;
  };
}

interface ReservasiDetail {
  id: string;
  kodeBooking: string;
  namaPemesan: string;
  noHp: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  jumlahTamu: number;
  statusReservasi: string;
  statusPembayaran: string;
  totalBayar: number;
  catatan?: string | null;
  meja: {
    id: string;
    nomorMeja: string;
    kapasitas: number;
    ruangan: string;
    viewMeja?: string | null;
    lokasiArea?: string | null;
  };
  detailMenu: DetailMenuItem[];
}

interface MenuOption {
  id: string;
  namaMenu: string;
  harga: number;
  kategori: string;
  deskripsi?: string | null;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatTanggalID(tglStr: string): string {
  const d = new Date(tglStr);
  if (isNaN(d.getTime())) return tglStr;
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatJamWIB(jamStr: string): string {
  if (!jamStr) return "--:--";
  const d = new Date(jamStr);
  if (!isNaN(d.getTime())) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  }
  return String(jamStr).slice(0, 5);
}

function KontenStrukReservasi() {
  const params = useParams();
  const kode =
    typeof params?.kode === "string" ? decodeURIComponent(params.kode) : "";

  const [reservasi, setReservasi] = useState<ReservasiDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorLoad, setErrorLoad] = useState<string | null>(null);
  const [copiedKode, setCopiedKode] = useState<boolean>(false);

  // State Modal Tambah Pesanan (Add-On)
  const [modalAddonBuka, setModalAddonBuka] = useState<boolean>(false);
  const [daftarMenu, setDaftarMenu] = useState<MenuOption[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(false);
  const [cariMenu, setCariMenu] = useState<string>("");
  const [qtyAddon, setQtyAddon] = useState<Record<string, number>>({});
  const [catatanAddon, setCatatanAddon] = useState<Record<string, string>>({});
  const [submittingAddon, setSubmittingAddon] = useState<boolean>(false);
  const [errorAddon, setErrorAddon] = useState<string | null>(null);
  const [suksesAddon, setSuksesAddon] = useState<string | null>(null);

  const fetchDetailReservasi = useCallback(async () => {
    if (!kode) return;
    try {
      const res = await fetch(`/api/reservasi/${encodeURIComponent(kode)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Reservasi tidak ditemukan.");
      }
      setReservasi(json.data);
      setErrorLoad(null);
    } catch (err: any) {
      setErrorLoad(err.message || "Gagal memuat detail reservasi.");
    } finally {
      setLoading(false);
    }
  }, [kode]);

  useEffect(() => {
    fetchDetailReservasi();
  }, [fetchDetailReservasi]);

  useEffect(() => {
    if (!reservasi?.kodeBooking) return;
    try {
      localStorage.setItem("elevenicious_last_booking", reservasi.kodeBooking);
    } catch {
      // Abaikan
    }
  }, [reservasi?.kodeBooking]);

  const bukaModalAddon = async () => {
    setQtyAddon({});
    setCatatanAddon({});
    setErrorAddon(null);
    setSuksesAddon(null);
    setCariMenu("");
    setModalAddonBuka(true);

    if (daftarMenu.length === 0) {
      setLoadingMenu(true);
      try {
        const res = await fetch("/api/menu");
        const json = await res.json();
        if (res.ok && json.success) {
          setDaftarMenu(json.data || []);
        }
      } catch {
        setErrorAddon("Gagal memuat daftar menu.");
      } finally {
        setLoadingMenu(false);
      }
    }
  };

  const ubahQtyAddon = (menuId: string, delta: number) => {
    setQtyAddon((prev) => {
      const next = Math.max(0, (prev[menuId] || 0) + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[menuId];
        return copy;
      }
      return { ...prev, [menuId]: next };
    });
  };

  const menuTersaring = useMemo(() => {
    if (!cariMenu.trim()) return daftarMenu;
    return daftarMenu.filter((m) =>
      m.namaMenu.toLowerCase().includes(cariMenu.toLowerCase()),
    );
  }, [daftarMenu, cariMenu]);

  const totalItemAddon = useMemo(
    () => Object.values(qtyAddon).reduce((a, b) => a + b, 0),
    [qtyAddon],
  );

  const totalHargaAddon = useMemo(
    () =>
      Object.entries(qtyAddon).reduce((sum, [id, qty]) => {
        const item = daftarMenu.find((m) => m.id === id);
        return sum + (item ? item.harga * qty : 0);
      }, 0),
    [qtyAddon, daftarMenu],
  );

  const handleKirimAddon = async () => {
    if (totalItemAddon === 0) {
      setErrorAddon("Pilih minimal 1 menu tambahan terlebih dahulu.");
      return;
    }

    setSubmittingAddon(true);
    setErrorAddon(null);
    setSuksesAddon(null);

    const items = Object.entries(qtyAddon).map(([menuId, jumlah]) => ({
      menuId,
      jumlah,
      catatanKhusus: catatanAddon[menuId]?.trim() || undefined,
    }));

    try {
      const res = await fetch(
        `/api/reservasi/${encodeURIComponent(kode)}/addon`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        },
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal menambahkan pesanan.");
      }

      if (json.data?.reservasi) {
        setReservasi(json.data.reservasi);
      } else {
        await fetchDetailReservasi();
      }

      setSuksesAddon(
        "Menu tambahan berhasil dimasukkan dan total tagihan diperbarui!",
      );
      setTimeout(() => {
        setModalAddonBuka(false);
        setSuksesAddon(null);
      }, 1000);
    } catch (err: any) {
      setErrorAddon(
        err.message || "Terjadi kesalahan saat menyimpan pesanan tambahan.",
      );
    } finally {
      setSubmittingAddon(false);
    }
  };

  const salinKodeBooking = () => {
    if (!reservasi?.kodeBooking) return;
    navigator.clipboard.writeText(reservasi.kodeBooking);
    setCopiedKode(true);
    setTimeout(() => setCopiedKode(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium text-neutral-600">
          Memuat struk digital reservasi...
        </p>
      </div>
    );
  }

  if (errorLoad || !reservasi) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xs">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-neutral-900">
            Data Reservasi Tidak Ditemukan
          </h1>
          <p className="mt-1.5 text-sm text-neutral-600">
            {errorLoad ||
              `Kode booking "${kode}" tidak terdaftar dalam sistem kami.`}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/reservasi"
              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition"
            >
              Buat Reservasi Baru
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
            >
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isLunas = reservasi.statusPembayaran === "LUNAS";
  const bisaTambahAddon =
    reservasi.statusReservasi !== "DIBATALKAN" &&
    reservasi.statusReservasi !== "SELESAI";
  const viewMeja = getKeteranganViewMeja(reservasi.meja);
  const zonaRuangan = getLabelRuangan(reservasi.meja.ruangan);

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-neutral-900 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Bar Navigasi Atas */}
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/reservasi"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Buat Reservasi Lain</span>
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Struk</span>
          </button>
        </div>

        {/* Kartu Struk Digital Reservasi */}
        <article className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          {/* Header Status Pembayaran LUNAS */}
          <div className="border-b border-neutral-100 bg-emerald-50/70 px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Struk Digital Resmi · Elevenicious
                </p>
                <h1 className="text-xl font-extrabold text-neutral-900">
                  Reservasi Terkonfirmasi
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold tracking-wide ${
                  isLunas
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isLunas ? "LUNAS" : reservasi.statusPembayaran}
              </span>
            </div>
          </div>

          {/* Kode Booking Banner */}
          <div className="px-6 py-4 bg-neutral-50/70 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs text-neutral-500">
                Kode Booking Anda
              </span>
              <p className="font-mono text-lg font-extrabold text-neutral-900 tracking-wider">
                {reservasi.kodeBooking}
              </p>
            </div>
            <button
              type="button"
              onClick={salinKodeBooking}
              className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition print:hidden"
            >
              {copiedKode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Kode</span>
                </>
              )}
            </button>
          </div>

          {/* Informasi Pemesan, Jadwal, dan Meja + View */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              {/* Info Pemesan & Jadwal */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Detail Pemesan &amp; Jadwal
                </h2>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-neutral-500">Nama Pemesan</p>
                    <p className="font-bold text-neutral-900">
                      {reservasi.namaPemesan}
                    </p>
                    <p className="text-xs text-neutral-600 tabular-nums">
                      {reservasi.noHp}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800 pt-1">
                    <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-medium">
                      {formatTanggalID(reservasi.tanggal)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-medium tabular-nums">
                      {formatJamWIB(reservasi.jamMulai)} –{" "}
                      {formatJamWIB(reservasi.jamSelesai)} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-800">
                    <Users className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="font-medium tabular-nums">
                      {reservasi.jumlahTamu} Tamu
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Meja, Zona & View */}
              <div className="space-y-3">
                <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Lokasi Meja &amp; Ruangan
                </h2>
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-600">
                      Nomor Meja
                    </span>
                    <span className="text-base font-extrabold text-neutral-900">
                      Meja {reservasi.meja.nomorMeja}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-neutral-600 shrink-0">
                      Zona Ruangan
                    </span>
                    <span className="text-xs font-bold text-neutral-900 text-right">
                      {zonaRuangan}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2 pt-2 border-t border-amber-200/60">
                    <span className="text-xs text-neutral-600 inline-flex items-center gap-1 shrink-0">
                      <Eye className="h-3.5 w-3.5 text-amber-600" />
                      View Meja
                    </span>
                    <span className="text-xs font-semibold text-amber-800 text-right inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {viewMeja}
                    </span>
                  </div>
                </div>

                {reservasi.catatan && (
                  <p className="text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-800">
                      Catatan Reservasi:
                    </span>{" "}
                    {reservasi.catatan}
                  </p>
                )}
              </div>
            </div>

            {/* Daftar Menu Pesanan */}
            <div className="border-t border-neutral-100 pt-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                  Daftar Menu Pesanan
                </h2>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {reservasi.detailMenu.length} item baris
                </span>
              </div>

              {reservasi.detailMenu.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 py-5 px-4 text-center text-xs text-neutral-500">
                  Belum ada menu yang dipesan. Klik tombol &ldquo;Tambah Pesanan
                  (Add-On)&rdquo; di bawah untuk menambah hidangan ke meja Anda.
                </div>
              ) : (
                <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200/80 overflow-hidden">
                  {reservasi.detailMenu.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 px-4 py-3 bg-white text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900">
                          <span className="tabular-nums text-amber-700 mr-1.5">
                            {item.jumlah}×
                          </span>
                          {item.menu?.namaMenu}
                        </p>
                        {item.catatanKhusus && (
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {item.catatanKhusus}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-neutral-900 tabular-nums shrink-0">
                        {rupiah.format(Number(item.subtotal))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Pembayaran */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-900 px-5 py-4 text-white">
                <div>
                  <p className="text-xs text-neutral-300">
                    Total Pembayaran ({isLunas ? "Lunas" : "Tagihan"})
                  </p>
                  <p className="text-[11px] text-emerald-300 font-medium">
                    Sudah termasuk konfirmasi meja
                  </p>
                </div>
                <span className="text-xl font-extrabold tabular-nums">
                  {rupiah.format(Number(reservasi.totalBayar))}
                </span>
              </div>
            </div>

            {/* Aturan Pembatalan (No-Cancel Policy) & Tombol Add-On */}
            <div className="border-t border-neutral-100 pt-5 space-y-4 print:hidden">
              {isLunas && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 flex items-start gap-2.5 text-xs text-neutral-600">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-800">
                      Kebijakan No-Cancel:
                    </span>{" "}
                    Reservasi yang sudah berstatus <strong>LUNAS</strong> tidak
                    dapat dibatalkan. Anda tetap dapat menambahkan pesanan menu
                    baru (Add-On) untuk meja ini.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {!isLunas && reservasi.statusReservasi !== "DIBATALKAN" ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-400 cursor-not-allowed"
                  >
                    Batalkan Reservasi
                  </button>
                ) : (
                  <div className="text-xs text-neutral-400">
                    Tunjukkan kode booking ini kepada resepsionis saat tiba.
                  </div>
                )}

                {bisaTambahAddon && (
                  <button
                    type="button"
                    onClick={bukaModalAddon}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-amber-600 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Pesanan (Add-On)
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Modal Tambah Pesanan (Add-On) */}
      {modalAddonBuka && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-lg font-extrabold text-neutral-900">
                  Tambah Pesanan (Add-On)
                </h3>
                <p className="text-xs text-neutral-500">
                  Meja {reservasi.meja.nomorMeja} · Kode{" "}
                  <span className="font-mono font-semibold text-amber-700">
                    {reservasi.kodeBooking}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAddonBuka(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-3">
              <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari menu yang ingin ditambahkan..."
                value={cariMenu}
                onChange={(e) => setCariMenu(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3 py-2 text-xs text-neutral-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {errorAddon && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {errorAddon}
              </div>
            )}
            {suksesAddon && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-semibold">
                {suksesAddon}
              </div>
            )}

            <div className="mt-3 space-y-2.5 overflow-y-auto flex-1 pr-1">
              {loadingMenu ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                  Memuat daftar menu...
                </div>
              ) : menuTersaring.length === 0 ? (
                <p className="py-8 text-center text-xs text-neutral-500">
                  Menu tidak ditemukan.
                </p>
              ) : (
                menuTersaring.map((menu) => {
                  const qty = qtyAddon[menu.id] || 0;
                  return (
                    <div
                      key={menu.id}
                      className={`rounded-xl border p-3 transition ${
                        qty > 0
                          ? "border-amber-400 bg-amber-50/40"
                          : "border-neutral-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-neutral-900 truncate">
                            {menu.namaMenu}
                          </p>
                          <p className="text-xs font-semibold text-amber-700 tabular-nums">
                            {rupiah.format(menu.harga)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => ubahQtyAddon(menu.id, -1)}
                            disabled={qty === 0}
                            className="h-7 w-7 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => ubahQtyAddon(menu.id, 1)}
                            className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center hover:bg-amber-600"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {qty > 0 && (
                        <input
                          type="text"
                          placeholder="Catatan khusus (opsional)"
                          value={catatanAddon[menu.id] || ""}
                          onChange={(e) =>
                            setCatatanAddon((prev) => ({
                              ...prev,
                              [menu.id]: e.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 focus:border-amber-500 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-neutral-600">
                  Tambahan ({totalItemAddon} item):
                </span>
                <span className="font-extrabold text-neutral-900 tabular-nums">
                  {rupiah.format(totalHargaAddon)}
                </span>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAddonBuka(false)}
                  className="flex-1 rounded-xl border border-neutral-200 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={totalItemAddon === 0 || submittingAddon}
                  onClick={handleKirimAddon}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50 transition cursor-pointer"
                >
                  {submittingAddon ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Tambahan Menu"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HalamanDetailStrukReservasi() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FFFDF7] flex flex-col items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-medium text-neutral-600">
            Memuat struk digital reservasi...
          </p>
        </div>
      }
    >
      <KontenStrukReservasi />
    </Suspense>
  );
}
