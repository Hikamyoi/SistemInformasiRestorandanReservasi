"use client";

import React, { useState, useMemo } from "react";
import {
  Armchair,
  Eye,
  Trees,
  Wind,
  CigaretteOff,
  CheckCircle2,
  Lock,
  Users,
  MapPin,
  Crown,
} from "lucide-react";

export interface MejaFloorplanItem {
  id: string;
  nomorMeja: string;
  kapasitas: number;
  ruangan: string; // "INDOOR_NON_SMOKING" | "OUTDOOR_SMOKING" | "VIP_NON_SMOKING"
  viewMeja?: string | null;
  posisiX?: number | null;
  posisiY?: number | null;
  lokasiArea?: string | null;
  statusMeja?: string;
  isTersedia: boolean;
  reservasiAktif?: {
    statusReservasi: string;
    statusPembayaran: string;
  } | null;
}

interface DenahMejaProps {
  daftarMeja: MejaFloorplanItem[];
  selectedMejaId: string;
  onSelectMeja: (meja: MejaFloorplanItem) => void;
  jumlahTamu: number;
  loading?: boolean;
}

/**
 * Mengembalikan keterangan view meja yang mudah dipahami pelanggan
 */
export function getKeteranganViewMeja(meja: {
  viewMeja?: string | null;
  lokasiArea?: string | null;
  ruangan?: string;
  nomorMeja?: string;
}): string {
  if (meja.viewMeja && meja.viewMeja.trim()) {
    return meja.viewMeja.trim();
  }

  const area = (meja.lokasiArea || "").toLowerCase();
  const ruangan = meja.ruangan || "";

  if (area.includes("jendela")) return "Dekat Jendela · Street View";
  if (area.includes("family")) return "Sudut Keluarga · Area Tenang";
  if (area.includes("hall")) return "Tengah Ruangan · Hall Utama";
  if (area.includes("garden")) return "Dekat Taman · Garden View";
  if (area.includes("canopy")) return "Area Kanopi · Semi-Terbuka";
  if (area.includes("terrace")) return "Teras Senja · Outdoor Breeze";
  if (area.includes("vip") || ruangan === "VIP_NON_SMOKING") {
    return "Private VIP Room · Eksklusif";
  }

  if (meja.lokasiArea) return meja.lokasiArea;
  return ruangan === "OUTDOOR_SMOKING"
    ? "Area Terbuka · Garden View"
    : "Tengah Ruangan · AC Indoor";
}

export function getLabelRuangan(ruangan: string): string {
  switch (ruangan) {
    case "OUTDOOR_SMOKING":
      return "Ruang Outdoor (Smoking Area)";
    case "VIP_NON_SMOKING":
      return "Ruang VIP Private (Non-Smoking)";
    case "INDOOR_NON_SMOKING":
    default:
      return "Ruang Indoor (Non-Smoking Area)";
  }
}

type ZonaTab = "INDOOR" | "OUTDOOR";

export default function DenahMeja({
  daftarMeja,
  selectedMejaId,
  onSelectMeja,
  jumlahTamu,
  loading = false,
}: DenahMejaProps) {
  const [zonaAktif, setZonaAktif] = useState<ZonaTab>("INDOOR");

  // Kelompokkan meja berdasarkan zona Non-Smoking (Indoor + VIP) dan Smoking (Outdoor)
  const { mejaIndoor, mejaVip, mejaOutdoor } = useMemo(() => {
    const sortByKoordinat = (a: MejaFloorplanItem, b: MejaFloorplanItem) => {
      const yDiff = (a.posisiY ?? 0) - (b.posisiY ?? 0);
      if (yDiff !== 0) return yDiff;
      return (a.posisiX ?? 0) - (b.posisiX ?? 0);
    };

    return {
      mejaIndoor: daftarMeja
        .filter((m) => m.ruangan === "INDOOR_NON_SMOKING")
        .sort(sortByKoordinat),
      mejaVip: daftarMeja
        .filter((m) => m.ruangan === "VIP_NON_SMOKING")
        .sort(sortByKoordinat),
      mejaOutdoor: daftarMeja
        .filter((m) => m.ruangan === "OUTDOOR_SMOKING")
        .sort(sortByKoordinat),
    };
  }, [daftarMeja]);

  const mejaTerpilih = useMemo(
    () => daftarMeja.find((m) => m.id === selectedMejaId) || null,
    [daftarMeja, selectedMejaId],
  );

  const jumlahTersediaIndoor = [...mejaIndoor, ...mejaVip].filter(
    (m) => m.isTersedia && m.kapasitas >= jumlahTamu,
  ).length;
  const jumlahTersediaOutdoor = mejaOutdoor.filter(
    (m) => m.isTersedia && m.kapasitas >= jumlahTamu,
  ).length;

  const renderKartuMeja = (meja: MejaFloorplanItem) => {
    const isSelected = selectedMejaId === meja.id;
    const kapasitasCukup = meja.kapasitas >= jumlahTamu;
    const bisaDipilih = meja.isTersedia && kapasitasCukup;
    const viewLabel = getKeteranganViewMeja(meja);
    const isVip = meja.ruangan === "VIP_NON_SMOKING";

    // Styling status yang tegas (tidak hanya warna, tapi ikon & label teks)
    let containerClasses =
      "relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-150 ";
    if (isSelected) {
      containerClasses +=
        "border-amber-500 bg-amber-50/90 ring-2 ring-amber-500 shadow-md";
    } else if (!meja.isTersedia) {
      containerClasses +=
        "border-rose-200 bg-rose-50/60 text-neutral-500 cursor-not-allowed opacity-85";
    } else if (!kapasitasCukup) {
      containerClasses +=
        "border-neutral-200 bg-neutral-100 text-neutral-400 cursor-not-allowed opacity-75";
    } else {
      containerClasses +=
        "border-emerald-300 bg-emerald-50/50 hover:border-emerald-500 hover:bg-emerald-50 hover:-translate-y-0.5 cursor-pointer shadow-xs";
    }

    return (
      <button
        key={meja.id}
        type="button"
        disabled={!bisaDipilih}
        onClick={() => {
          if (bisaDipilih) onSelectMeja(meja);
        }}
        className={containerClasses}
      >
        {/* Header Nomor Meja & Status */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              aria-hidden="true"
              className={`inline-block h-8 w-8 shrink-0 rounded-lg ${
                isSelected
                  ? "bg-amber-500"
                  : !meja.isTersedia
                    ? "bg-rose-200"
                    : !kapasitasCukup
                      ? "bg-neutral-200"
                      : "bg-emerald-600"
              }`}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
                  Meja {meja.nomorMeja}
                </span>
                {isVip && (
                  <Crown
                    className="h-3.5 w-3.5 text-amber-600 shrink-0"
                    aria-label="VIP"
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-600 tabular-nums whitespace-nowrap mt-0.5">
                <Armchair className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                <span>{meja.kapasitas} Kursi</span>
              </div>
            </div>
          </div>

          {/* Label Status Eksplisit */}
          {isSelected ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-4 w-4 text-amber-600" />
              Dipilih
            </span>
          ) : !meja.isTersedia ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 whitespace-nowrap shrink-0">
              <Lock className="h-3.5 w-3.5" />
              Terisi
            </span>
          ) : !kapasitasCukup ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 whitespace-nowrap shrink-0">
              <Users className="h-3.5 w-3.5" />
              Maks {meja.kapasitas}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Tersedia
            </span>
          )}
        </div>

        {/* Keterangan View Meja */}
        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-neutral-700 font-medium min-w-0">
            <Eye className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{viewLabel}</span>
          </span>
          {meja.posisiX !== null &&
            meja.posisiX !== undefined &&
            meja.posisiY !== null &&
            meja.posisiY !== undefined && (
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums shrink-0 hidden sm:inline">
                ({meja.posisiX},{meja.posisiY})
              </span>
            )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Navigasi Tab Ruangan (Indoor Non-Smoking vs Outdoor Smoking) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-neutral-100 border border-neutral-200 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setZonaAktif("INDOOR")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              zonaAktif === "INDOOR"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <CigaretteOff className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Indoor (Non-Smoking)</span>
            <span className="text-xs font-bold text-emerald-700 tabular-nums">
              ({jumlahTersediaIndoor})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setZonaAktif("OUTDOOR")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              zonaAktif === "OUTDOOR"
                ? "bg-white text-neutral-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Wind className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Outdoor (Smoking)</span>
            <span className="text-xs font-bold text-emerald-700 tabular-nums">
              ({jumlahTersediaOutdoor})
            </span>
          </button>
        </div>

        {/* Legenda Warna Status */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 border border-emerald-600 inline-block" />
            Tersedia
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-amber-500 border border-amber-600 inline-block" />
            Dipilih
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-rose-200 border border-rose-300 inline-block" />
            Terisi / Dipesan
          </span>
        </div>
      </div>

      {/* Area Denah Grafis Ruangan */}
      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-10 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-2" />
          <p className="text-sm font-medium text-neutral-600">
            Menyinkronkan ketersediaan meja secara real-time...
          </p>
        </div>
      ) : zonaAktif === "INDOOR" ? (
        <div className="rounded-2xl border border-neutral-200 bg-[#FAFAF8] p-4 sm:p-5 space-y-5">
          {/* Tata Letak Meja Indoor Utama */}
          {mejaIndoor.length === 0 ? (
            <p className="text-center py-6 text-sm text-neutral-500">
              Belum ada meja terdaftar pada zona Indoor Non-Smoking.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {mejaIndoor.map(renderKartuMeja)}
            </div>
          )}

          {/* Pembatas Area VIP Non-Smoking jika ada */}
          {mejaVip.length > 0 && (
            <div className="pt-4 border-t border-dashed border-neutral-300 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-4 w-4 text-amber-600" />
                  Area Private VIP (Non-Smoking · Ruang Tertutup)
                </span>
                <span className="text-neutral-500 font-normal">
                  Cocok untuk rapat atau acara keluarga
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {mejaVip.map(renderKartuMeja)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-[#F7FAF7] p-4 sm:p-5 space-y-5">
          {/* Penanda Arsitektur Sisi Taman: Garden View */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-xs font-medium text-emerald-900">
            <span className="inline-flex items-center gap-2">
              <Trees className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Area Taman Terbuka &amp; Kolam Hias · Garden View</span>
            </span>
            <span className="text-emerald-700 font-semibold whitespace-nowrap">
              Smoking Area · Sirkulasi Terbuka
            </span>
          </div>

          {/* Tata Letak Meja Outdoor */}
          {mejaOutdoor.length === 0 ? (
            <p className="text-center py-6 text-sm text-neutral-500">
              Belum ada meja terdaftar pada zona Outdoor Smoking.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {mejaOutdoor.map(renderKartuMeja)}
            </div>
          )}
        </div>
      )}

      {/* Ringkasan Informasi Meja Terpilih */}
      {mejaTerpilih ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-3">
            <div
              aria-hidden="true"
              className="h-9 w-9 rounded-lg bg-amber-500 shrink-0"
            />
            <div>
              <p className="text-sm font-bold text-neutral-900">
                Meja {mejaTerpilih.nomorMeja} terpilih ·{" "}
                {getLabelRuangan(mejaTerpilih.ruangan)}
              </p>
              <p className="text-xs text-neutral-700 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-600" />
                  View: {getKeteranganViewMeja(mejaTerpilih)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Kapasitas {mejaTerpilih.kapasitas} orang
                </span>
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
            Siap Direservasi
          </span>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Klik salah satu meja berwarna hijau pada denah ruangan di atas untuk
          memilih tempat duduk Anda.
        </p>
      )}
    </div>
  );
}
