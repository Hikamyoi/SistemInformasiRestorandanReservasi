"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateStatusReservasi } from "@/app/staff/dashboard/actions";
// Import tipe khusus dengan 'import type' agar tidak crash di Next.js
import type { StatusReservasiType } from "@/app/staff/dashboard/actions";

interface Props {
  reservasiId: string;
  statusSaatIni: string;
  statusPembayaran: string;
}

export default function TombolAksiStaf({
  reservasiId,
  statusSaatIni,
  statusPembayaran,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (statusBaru: StatusReservasiType) => {
    startTransition(async () => {
      await updateStatusReservasi(reservasiId, statusBaru);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tombol Konfirmasi jika masih menunggu */}
      {statusSaatIni === "MENUNGGU_KONFIRMASI" && (
        <button
          disabled={isPending}
          onClick={() => handleUpdate("DIKONFIRMASI")}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Proses..." : "Konfirmasi"}
        </button>
      )}

      {/* Tombol Pelanggan Datang (Seated/Selesai) */}
      {statusSaatIni === "DIKONFIRMASI" && (
        <button
          disabled={isPending}
          onClick={() => handleUpdate("SELESAI")}
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Proses..." : "Tandai Selesai / Datang"}
        </button>
      )}

      {/* Shortcut Ke Kasir jika belum bayar */}
      {statusPembayaran === "BELUM_BAYAR" && statusSaatIni !== "DIBATALKAN" && (
        <Link
          href={`/staff/cashier?id=${reservasiId}`}
          className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Proses Kasir
        </Link>
      )}

      {/* Tombol Batalkan */}
      {statusSaatIni !== "DIBATALKAN" && statusSaatIni !== "SELESAI" && (
        <button
          disabled={isPending}
          onClick={() => handleUpdate("DIBATALKAN")}
          className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-200 disabled:opacity-50"
        >
          Batalkan
        </button>
      )}
    </div>
  );
}