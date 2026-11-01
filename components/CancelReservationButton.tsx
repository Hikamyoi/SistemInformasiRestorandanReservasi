"use client";

import { useState, useTransition } from "react";
import { batalkanReservasi } from "@/app/dashboard/actions";

export default function CancelReservationButton({ reservasiId }: { reservasiId: string }) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function batalkan() {
    setPesanError(null);
    startTransition(async () => {
      const hasil = await batalkanReservasi(reservasiId);
      // Jika berhasil, halaman otomatis diperbarui (revalidatePath) dan kartu berubah status.
      if (!hasil.success) {
        setPesanError(hasil.message ?? "Gagal membatalkan reservasi.");
        setKonfirmasi(false);
      }
    });
  }

  if (!konfirmasi) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setKonfirmasi(true)}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          Batalkan reservasi
        </button>
        {pesanError && (
          <p role="alert" className="mt-2 text-xs font-medium text-red-600">
            {pesanError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div role="alertdialog" aria-label="Konfirmasi pembatalan" className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-neutral-700">Yakin ingin membatalkan?</span>
      <button
        type="button"
        onClick={batalkan}
        disabled={pending}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {pending ? "Membatalkan…" : "Ya, batalkan"}
      </button>
      <button
        type="button"
        onClick={() => setKonfirmasi(false)}
        disabled={pending}
        className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-amber-500 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60"
      >
        Tidak
      </button>
    </div>
  );
}
