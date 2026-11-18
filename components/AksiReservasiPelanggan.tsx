// components/AksiReservasiPelanggan.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface MenuOption {
  id: string;
  namaMenu: string;
  harga: number;
  kategori?: string | null;
}

interface Props {
  kodeBooking: string;
  statusPembayaran: string;
  statusReservasi: string;
  daftarMenu: MenuOption[];
}

export default function AksiReservasiPelanggan({
  kodeBooking,
  statusPembayaran,
  statusReservasi,
  daftarMenu = [],
}: Props) {
  const router = useRouter();
  const [bukaModal, setBukaModal] = useState(false);
  const [menuDipilih, setMenuDipilih] = useState<string>(
    daftarMenu[0]?.id || "",
  );
  const [jumlah, setJumlah] = useState<number>(1);
  const [catatan, setCatatan] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pesanError, setPesanError] = useState<string | null>(null);

  // 1. Aksi Batalkan Reservasi (Memicu aturan No-Cancel 403)
  const handleBatalkan = async () => {
    if (
      !confirm(`Apakah Anda yakin ingin membatalkan reservasi ${kodeBooking}?`)
    ) {
      return;
    }

    setLoading(true);
    setPesanError(null);
    try {
      const res = await fetch(`/api/reservasi/${kodeBooking}/cancel`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (!res.ok) {
        // Ini yang akan tampil jika status LUNAS (HTTP 403 Forbidden)
        alert(`❌ GAGAL MEMBATALKAN (${res.status}):\n${data.error}`);
        return;
      }

      alert(`✅ Berhasil: ${data.message}`);
      router.refresh();
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. Aksi Tambah Pesanan (Add-on)
  const handleSimpanAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuDipilih || jumlah <= 0) return;

    setLoading(true);
    setPesanError(null);
    try {
      const res = await fetch(`/api/reservasi/${kodeBooking}/addon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              menuId: menuDipilih,
              jumlah: Number(jumlah),
              catatanKhusus: catatan || null,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menambahkan menu");
      }

      alert(
        `✅ Berhasil menambahkan pesanan! Total tagihan baru otomatis diperbarui.`,
      );
      setBukaModal(false);
      setJumlah(1);
      setCatatan("");
      router.refresh(); // Refresh halaman agar data baru & total langsung update
    } catch (err: any) {
      setPesanError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Tombol Tambah Menu (Add-on) */}
        {statusReservasi !== "DIBATALKAN" && statusReservasi !== "SELESAI" && (
          <button
            type="button"
            onClick={() => setBukaModal(true)}
            className="rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 focus:outline-none"
          >
            + Tambah Menu
          </button>
        )}

        {/* Tombol Batalkan (Akan memicu No-Cancel 403 jika Lunas) */}
        {statusReservasi !== "DIBATALKAN" && statusReservasi !== "SELESAI" && (
          <button
            type="button"
            onClick={handleBatalkan}
            disabled={loading}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            {loading ? "Memproses…" : "Batalkan"}
          </button>
        )}
      </div>

      {/* Modal / Popup Tambah Menu */}
      {bukaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-neutral-900">
              Tambah Pesanan Menu (Add-on)
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              Kode Reservasi:{" "}
              <span className="font-mono font-bold text-amber-700">
                {kodeBooking}
              </span>
            </p>

            {pesanError && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                {pesanError}
              </div>
            )}

            <form onSubmit={handleSimpanAddon} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Pilih Menu Tambahan
                </label>
                <select
                  value={menuDipilih}
                  onChange={(e) => setMenuDipilih(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-amber-200 bg-amber-50/30 p-2.5 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                >
                  {daftarMenu.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.namaMenu} — Rp{" "}
                      {Number(m.harga).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Jumlah Porsi
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={jumlah}
                  onChange={(e) => setJumlah(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 w-full rounded-xl border border-amber-200 p-2.5 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Es dipisah, manis sedang"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-amber-200 p-2.5 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBukaModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-neutral-500 hover:bg-neutral-100"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-amber-500 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50"
                >
                  {loading ? "Menyimpan…" : "Simpan Pesanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
