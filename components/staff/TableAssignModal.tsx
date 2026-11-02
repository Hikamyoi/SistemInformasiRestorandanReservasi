"use client";

import { useState, useEffect, useTransition } from "react";
import { ambilDaftarMeja, alokasiDanCheckIn } from "@/app/staff/dashboard/actions";
import type { StatusReservasiType } from "@/app/staff/dashboard/actions";

const fontJudul = "font-[family-name:var(--font-baloo)]";

interface MejaItem {
  id: string;
  nomorMeja: number;
  lokasiArea: string;
  kapasitas: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservasi: {
    id: string;
    namaPelanggan: string;
    jumlahTamu: number;
    mejaIdSaatIni: string;
    nomorMejaSaatIni: number;
    statusSaatIni: string;
  };
}

export default function ModalAlokasiMeja({ isOpen, onClose, reservasi }: Props) {
  const [daftarMeja, setDaftarMeja] = useState<MejaItem[]>([]);
  const [selectedMejaId, setSelectedMejaId] = useState<string>(reservasi.mejaIdSaatIni);
  const [loadingMeja, setLoadingMeja] = useState<boolean>(true);
  const [isPending, startTransition] = useTransition();

  // Reset & load daftar meja saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSelectedMejaId(reservasi.mejaIdSaatIni);
      setLoadingMeja(true);
      ambilDaftarMeja().then((res) => {
        if (res.success && res.data) {
          setDaftarMeja(res.data as unknown as MejaItem[]);
        }
        setLoadingMeja(false);
      });
    }
  }, [isOpen, reservasi.mejaIdSaatIni]);

  if (!isOpen) return null;

  const handleSimpan = (statusBaru: StatusReservasiType) => {
    if (!selectedMejaId) {
      alert("Silakan pilih meja terlebih dahulu!");
      return;
    }

    startTransition(async () => {
      const res = await alokasiDanCheckIn({
        reservasiId: reservasi.id,
        mejaId: selectedMejaId,
        statusBaru,
      });

      if (res.success) {
        onClose();
      } else {
        alert(res.error || "Gagal mengalokasikan meja.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6">
        <header className="flex justify-between items-center border-b border-amber-100 pb-3">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase">Alokasi & Check-in</span>
            <h3 className={`${fontJudul} text-xl font-bold text-neutral-900`}>
              {reservasi.namaPelanggan}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200"
          >
            ✕
          </button>
        </header>

        {/* Ringkasan Informasi */}
        <div className="rounded-2xl bg-amber-50 p-4 text-xs text-neutral-700 space-y-1">
          <p>
            <span className="font-semibold">Jumlah Tamu:</span> {reservasi.jumlahTamu} orang
          </p>
          <p>
            <span className="font-semibold">Meja Saat Ini:</span> Meja {reservasi.nomorMejaSaatIni}
          </p>
        </div>

        {/* Pilihan Meja */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
            Pilih Meja Restoran
          </label>

          {loadingMeja ? (
            <p className="text-xs text-neutral-400">Memuat daftar meja...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {daftarMeja.map((meja) => {
                const isSelected = meja.id === selectedMejaId;
                const cukupKapasitas = meja.kapasitas >= reservasi.jumlahTamu;

                return (
                  <button
                    key={meja.id}
                    type="button"
                    onClick={() => setSelectedMejaId(meja.id)}
                    className={`rounded-2xl p-3 border text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-500 text-white shadow-md"
                        : cukupKapasitas
                        ? "border-neutral-200 bg-white hover:border-amber-300 text-neutral-800"
                        : "border-neutral-100 bg-neutral-50 text-neutral-400 opacity-60"
                    }`}
                  >
                    <p className="font-bold text-sm">Meja {meja.nomorMeja}</p>
                    <p className={`text-xs ${isSelected ? "text-amber-100" : "text-neutral-500"}`}>
                      {meja.lokasiArea} · Cap: {meja.kapasitas} orang
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-amber-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200"
          >
            Batal
          </button>

          {reservasi.statusSaatIni === "MENUNGGU_KONFIRMASI" && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSimpan("DIKONFIRMASI")}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Memproses..." : "Konfirmasi Meja"}
            </button>
          )}

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSimpan("SELESAI")}
            className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending ? "Memproses..." : "Check-in (Pelanggan Datang)"}
          </button>
        </div>
      </div>
    </div>
  );
}