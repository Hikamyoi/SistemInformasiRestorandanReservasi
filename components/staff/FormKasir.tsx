"use client";

import { useState, useTransition } from "react";
import { prosesPembayaranKasir } from "@/app/staff/cashier/actions";
import StrukPembayaran from "@/components/staff/StrukPembayaran";

const fontJudul = "font-[family-name:var(--font-baloo)]";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export default function FormKasir({ daftarReservasi, idTerpilih }: { daftarReservasi: any[]; idTerpilih?: string }) {
  const [selectedId, setSelectedId] = useState<string>(idTerpilih || daftarReservasi[0]?.id || "");
  const [metodePembayaran, setMetodePembayaran] = useState<string>("TUNAI");
  const [nominalBayar, setNominalBayar] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const reservasiAktif = daftarReservasi.find((r) => r.id === selectedId);

  // Perhitungan Keuangan
  const subtotal = reservasiAktif
    ? reservasiAktif.detailMenu.reduce((acc: number, item: any) => acc + Number(item.subtotal), 0)
    : 0;
  
  const pajak = subtotal * 0.10; // PPN 10%
  const serviceCharge = subtotal * 0.05; // Service Charge 5%
  const grandTotal = subtotal + pajak + serviceCharge;

  const uangDiterima = metodePembayaran === "TUNAI" ? Number(nominalBayar) || 0 : grandTotal;
  const kembalian = uangDiterima >= grandTotal ? uangDiterima - grandTotal : 0;
  const bisaBayar = reservasiAktif && uangDiterima >= grandTotal;

  const handleProsesTransaksi = () => {
    if (!reservasiAktif) return;

    startTransition(async () => {
      const res = await prosesPembayaranKasir({
        reservasiId: reservasiAktif.id,
        metodePembayaran,
      });

      if (res.success) {
        // Pemicu dialog print browser
        window.print();
      } else {
        alert(res.error || "Terjadi kesalahan saat memproses pembayaran.");
      }
    });
  };

  if (daftarReservasi.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-amber-300 bg-white p-8 text-center">
        <span aria-hidden className="text-4xl">✨</span>
        <p className={`${fontJudul} mt-2 text-lg font-bold text-neutral-900`}>Tidak ada tagihan aktif</p>
        <p className="text-sm text-neutral-500">Semua reservasi sudah lunas atau belum memiliki pesanan.</p>
      </div>
    );
  }

  return (
    <>
      {/* Visual Tampilan Kasir (Bisa dicetak / Di-print) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Kolom Kiri: Pilih Reservasi */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className={`${fontJudul} text-lg font-bold text-neutral-900 mb-2`}>
            Pilih Tagihan Pelanggan ({daftarReservasi.length})
          </h2>
          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {daftarReservasi.map((r) => {
              const totalPesanan = r.detailMenu.reduce((sum: number, item: any) => sum + Number(item.subtotal), 0);
              const isSelected = r.id === selectedId;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                    isSelected
                      ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-500/20"
                      : "border-neutral-200 bg-white hover:border-amber-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-neutral-900">{r.user?.nama || "Pelanggan"}</h4>
                      <p className="text-xs text-neutral-500">
                        Meja {r.meja.nomorMeja} ({r.meja.lokasiArea}) · {r.jamMulai} WIB
                      </p>
                    </div>
                    <span className="font-semibold text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                      {rupiah.format(totalPesanan)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Rincian & Kalkulator Pembayaran */}
        <div className="lg:col-span-7">
          {reservasiAktif && (
            <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)] border border-amber-100 space-y-6">
              <header className="border-b border-amber-100 pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Detail Transaksi
                </span>
                <h3 className={`${fontJudul} text-xl font-bold text-neutral-900`}>
                  {reservasiAktif.user?.nama || "Pelanggan"} — Meja {reservasiAktif.meja.nomorMeja}
                </h3>
              </header>

              {/* Rincian Menu Dipesan */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase">Daftar Pesanan</p>
                <ul className="divide-y divide-amber-100 rounded-2xl border border-amber-100 bg-[#FFFBF2] text-sm">
                  {reservasiAktif.detailMenu.map((d: any) => (
                    <li key={d.id} className="flex justify-between px-4 py-2.5 text-neutral-800">
                      <span>{d.jumlah}× {d.menu.namaMenu}</span>
                      <span className="font-medium tabular-nums">{rupiah.format(Number(d.subtotal))}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rincian Kalkulasi */}
              <div className="rounded-2xl bg-neutral-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal Pesanan</span>
                  <span className="tabular-nums font-medium">{rupiah.format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>PPN (10%)</span>
                  <span className="tabular-nums font-medium">{rupiah.format(pajak)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Service Charge (5%)</span>
                  <span className="tabular-nums font-medium">{rupiah.format(serviceCharge)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Total Tagihan</span>
                  <span className={`${fontJudul} text-xl text-amber-600 tabular-nums`}>
                    {rupiah.format(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Form Metode & Input Nominal */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["TUNAI", "QRIS", "DEBIT"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setMetodePembayaran(method)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          metodePembayaran === method
                            ? "bg-amber-500 text-white border-amber-500 shadow"
                            : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {metodePembayaran === "TUNAI" && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Nominal Uang Diterima (Rp)
                    </label>
                    <input
                      type="number"
                      value={nominalBayar}
                      onChange={(e) => setNominalBayar(e.target.value)}
                      placeholder={`Min. ${grandTotal}`}
                      className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold tabular-nums focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                )}

                {/* Kembalian */}
                <div className="flex justify-between items-center rounded-xl bg-amber-100/60 px-4 py-3 text-amber-900">
                  <span className="text-xs font-semibold">Uang Kembalian</span>
                  <span className={`${fontJudul} text-lg font-bold tabular-nums`}>
                    {rupiah.format(kembalian)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!bisaBayar || isPending}
                  onClick={handleProsesTransaksi}
                  className="w-full rounded-full bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "Memproses Transaksi..." : "Proses Pembayaran & Cetak Struk 🖨️"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Komponen Struk yang akan diprint */}
      <StrukPembayaran
        reservasi={reservasiAktif}
        subtotal={subtotal}
        pajak={pajak}
        serviceCharge={serviceCharge}
        totalBayar={grandTotal}
        uangDiterima={uangDiterima}
        kembalian={kembalian}
        metodePembayaran={metodePembayaran}
      />
    </>
  );
}