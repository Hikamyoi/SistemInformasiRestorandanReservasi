"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  ArrowLeft,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  Receipt,
} from "lucide-react";

interface DetailMenuLaporan {
  id: string;
  jumlah: number;
  subtotal: number | string;
  menu: {
    id: string;
    namaMenu: string;
    harga: number | string;
  };
}

interface TransaksiLunas {
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
  meja: {
    id: string;
    nomorMeja: string;
    ruangan: string;
    viewMeja?: string | null;
  };
  detailMenu: DetailMenuLaporan[];
}

interface SummaryLaporan {
  totalTransaksi: number;
  totalPendapatan: number;
  totalTamu: number;
  rataRataTransaksi: number;
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatJamRange(mulaiStr: string, selesaiStr: string): string {
  const ambilJam = (str: string) => {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    }
    return String(str).slice(0, 5);
  };
  return `${ambilJam(mulaiStr)} - ${ambilJam(selesaiStr)} WIB`;
}

function formatLabelRuangan(ruangan: string): string {
  switch (ruangan) {
    case "OUTDOOR_SMOKING":
      return "Outdoor (Smoking)";
    case "VIP_NON_SMOKING":
      return "VIP (Non-Smoking)";
    case "INDOOR_NON_SMOKING":
    default:
      return "Indoor (Non-Smoking)";
  }
}

function formatRincianMenu(detailMenu: DetailMenuLaporan[]): string {
  if (!detailMenu || detailMenu.length === 0) return "Hanya Reservasi Meja";
  return detailMenu
    .map((item) => `${item.jumlah}x ${item.menu?.namaMenu || "Menu"}`)
    .join(", ");
}

export default function HalamanLaporanPOSAdmin() {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [kataCari, setKataCari] = useState<string>("");

  const [transaksi, setTransaksi] = useState<TransaksiLunas[]>([]);
  const [summary, setSummary] = useState<SummaryLaporan>({
    totalTransaksi: 0,
    totalPendapatan: 0,
    totalTamu: 0,
    rataRataTransaksi: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const loadLaporan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const query = params.toString();
      const res = await fetch(`/api/admin/laporan${query ? `?${query}` : ""}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Gagal memuat data laporan transaksi.");
      }

      setTransaksi(json.data?.transaksi || []);
      setSummary(
        json.data?.summary || {
          totalTransaksi: 0,
          totalPendapatan: 0,
          totalTamu: 0,
          rataRataTransaksi: 0,
        },
      );
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadLaporan();
  }, [loadLaporan]);

  const transaksiTersaring = useMemo(() => {
    if (!kataCari.trim()) return transaksi;
    const q = kataCari.toLowerCase();
    return transaksi.filter(
      (t) =>
        t.kodeBooking.toLowerCase().includes(q) ||
        t.namaPemesan.toLowerCase().includes(q) ||
        t.noHp.toLowerCase().includes(q) ||
        t.meja?.nomorMeja.toLowerCase().includes(q),
    );
  }, [transaksi, kataCari]);

  const totalPendapatanTersaring = useMemo(
    () =>
      transaksiTersaring.reduce((sum, t) => sum + Number(t.totalBayar || 0), 0),
    [transaksiTersaring],
  );

  const totalTamuTersaring = useMemo(
    () =>
      transaksiTersaring.reduce((sum, t) => sum + Number(t.jumlahTamu || 0), 0),
    [transaksiTersaring],
  );

  const nilaiTotalPendapatan = kataCari.trim()
    ? totalPendapatanTersaring
    : summary.totalPendapatan;
  const nilaiTotalTamu = kataCari.trim()
    ? totalTamuTersaring
    : summary.totalTamu;
  const nilaiRataRata =
    transaksiTersaring.length > 0
      ? Math.round(nilaiTotalPendapatan / transaksiTersaring.length)
      : 0;

  const setPresetHariIni = () => {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(today);
  };

  const setPresetBulanIni = () => {
    const now = new Date();
    const awal = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
      .toISOString()
      .split("T")[0];
    const akhir = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
      .toISOString()
      .split("T")[0];
    setStartDate(awal);
    setEndDate(akhir);
  };

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    setKataCari("");
  };

  const handleExportExcel = () => {
    if (transaksiTersaring.length === 0) return;
    setExporting(true);

    try {
      const rowsExcel = transaksiTersaring.map((item, index) => ({
        No: index + 1,
        "Kode Booking": item.kodeBooking,
        Tanggal: formatTanggalID(item.tanggal),
        Jam: formatJamRange(item.jamMulai, item.jamSelesai),
        "Nama Pemesan": item.namaPemesan,
        "No HP": item.noHp,
        Ruangan: formatLabelRuangan(item.meja?.ruangan || "INDOOR_NON_SMOKING"),
        "Nomor Meja": item.meja?.nomorMeja || "-",
        "Rincian Menu": formatRincianMenu(item.detailMenu),
        "Total Bayar": Number(item.totalBayar || 0),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rowsExcel);

      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 18 },
        { wch: 14 },
        { wch: 17 },
        { wch: 24 },
        { wch: 16 },
        { wch: 22 },
        { wch: 12 },
        { wch: 45 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan POS Lunas");

      const suffixTanggal =
        startDate || endDate
          ? `${startDate || "awal"}_sd_${endDate || "akhir"}`
          : new Date().toISOString().split("T")[0];

      XLSX.writeFile(
        workbook,
        `Laporan_Transaksi_Elevenicious_${suffixTanggal}.xlsx`,
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Dashboard Admin</span>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 truncate">
              <span>Admin</span>
              <span>/</span>
              <span className="font-semibold text-slate-900">
                Laporan Transaksi POS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadLaporan}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || transaksiTersaring.length === 0 || exporting}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>
                {exporting ? "Menyiapkan Excel..." : "Export ke Excel (.xlsx)"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-7 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Laporan Transaksi POS &amp; Pendapatan (LUNAS)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Rekapitulasi transaksi reservasi dan pre-order menu yang telah
            terkonfirmasi lunas untuk kebutuhan pembukuan restoran.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Total Pendapatan (LUNAS)
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-emerald-700 tabular-nums">
              {rupiah.format(nilaiTotalPendapatan)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Jumlah Transaksi Lunas
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {transaksiTersaring.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Total Tamu Terlayani
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {nilaiTotalTamu} orang
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-500">
              Rata-Rata Nilai Transaksi
            </p>
            <p className="mt-1.5 text-2xl font-extrabold text-slate-900 tabular-nums">
              {rupiah.format(nilaiRataRata)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label
                htmlFor="startDate"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Dari Tanggal
              </label>
              <div className="relative">
                <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label
                htmlFor="endDate"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Sampai Tanggal
              </label>
              <div className="relative">
                <Calendar className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label
                htmlFor="cariTransaksi"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Cari Kode Booking / Pemesan / Meja
              </label>
              <div className="relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="cariTransaksi"
                  type="text"
                  placeholder="Contoh: RSV-, Budi, IN-02..."
                  value={kataCari}
                  onChange={(e) => setKataCari(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={setPresetHariIni}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={setPresetBulanIni}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
              >
                Bulan Ini
              </button>
              {(startDate || endDate || kataCari) && (
                <button
                  type="button"
                  onClick={resetFilter}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition cursor-pointer whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-900">
                Gagal Memuat Laporan
              </p>
              <p className="text-xs text-slate-500 mt-1">{error}</p>
            </div>
          ) : loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto mb-2" />
              Memuat transaksi POS LUNAS...
            </div>
          ) : transaksiTersaring.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Belum Ada Transaksi LUNAS pada Periode Ini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ubah rentang tanggal atau reset filter untuk melihat seluruh
                transaksi yang sudah dibayar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-3 px-3.5 whitespace-nowrap">No</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">
                      Kode Booking
                    </th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Tanggal</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Jam</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">
                      Nama Pemesan
                    </th>
                    <th className="py-3 px-3.5 whitespace-nowrap">No HP</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Ruangan</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">
                      Nomor Meja
                    </th>
                    <th className="py-3 px-3.5 min-w-[220px]">Rincian Menu</th>
                    <th className="py-3 px-3.5 text-right whitespace-nowrap">
                      Total Bayar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaksiTersaring.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors align-top"
                    >
                      <td className="py-3 px-3.5 font-mono text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <Link
                          href={`/reservasi/${encodeURIComponent(item.kodeBooking)}`}
                          className="font-mono font-bold text-amber-700 hover:underline"
                        >
                          {item.kodeBooking}
                        </Link>
                        <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold ml-2">
                          <CheckCircle2 className="h-3 w-3" />
                          LUNAS
                        </div>
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 tabular-nums">
                        {formatTanggalID(item.tanggal)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 tabular-nums">
                        {formatJamRange(item.jamMulai, item.jamSelesai)}
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {item.namaPemesan}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap tabular-nums">
                        {item.noHp}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap text-slate-700">
                        {formatLabelRuangan(item.meja?.ruangan || "")}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-bold text-slate-900">
                        {item.meja?.nomorMeja || "-"}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 leading-relaxed">
                        {formatRincianMenu(item.detailMenu)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap tabular-nums">
                        {rupiah.format(Number(item.totalBayar || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
