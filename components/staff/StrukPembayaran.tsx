/* Struk Pembayaran Siap Cetak (Thermal Printer / Standard)                   */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

interface StrukProps {
  reservasi: any;
  subtotal: number;
  pajak: number;
  serviceCharge: number;
  totalBayar: number;
  uangDiterima: number;
  kembalian: number;
  metodePembayaran: string;
}

export default function StrukPembayaran({
  reservasi,
  subtotal,
  pajak,
  serviceCharge,
  totalBayar,
  uangDiterima,
  kembalian,
  metodePembayaran,
}: StrukProps) {
  if (!reservasi) return null;

  return (
    <div className="hidden print:block font-mono text-xs text-black p-4 w-[80mm] mx-auto leading-tight">
      <div className="text-center mb-3">
        <h2 className="font-bold text-sm uppercase">Restoran & Cafe</h2>
        <p className="text-[10px]">Jl. Makanan Enak No. 88, Kota</p>
        <p className="text-[10px]">Telp: 0812-3456-7890</p>
      </div>

      <div className="border-t border-b border-dashed border-black py-2 my-2 space-y-0.5 text-[11px]">
        <p>No. Res: {reservasi.id.slice(-6).toUpperCase()}</p>
        <p>Tanggal: {new Date().toLocaleDateString("id-ID")}</p>
        <p>Pelanggan: {reservasi.user?.nama || "Pelanggan"}</p>
        <p>Meja: {reservasi.meja.nomorMeja} ({reservasi.meja.lokasiArea})</p>
      </div>

      {/* Detail Item Menu */}
      <div className="space-y-1 my-2">
        {reservasi.detailMenu.map((item: any) => (
          <div key={item.id} className="flex justify-between items-start">
            <div>
              <p>{item.jumlah}x {item.menu.namaMenu}</p>
            </div>
            <span>{rupiah.format(Number(item.subtotal))}</span>
          </div>
        ))}
      </div>

      {/* Rincian Hitungan */}
      <div className="border-t border-dashed border-black pt-2 mt-2 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{rupiah.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>PPN (10%):</span>
          <span>{rupiah.format(pajak)}</span>
        </div>
        <div className="flex justify-between">
          <span>Service (5%):</span>
          <span>{rupiah.format(serviceCharge)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
          <span>TOTAL:</span>
          <span>{rupiah.format(totalBayar)}</span>
        </div>
      </div>

      {/* Info Pembayaran */}
      <div className="border-t border-dashed border-black pt-2 mt-2 space-y-0.5 text-[11px]">
        <div className="flex justify-between">
          <span>Metode:</span>
          <span>{metodePembayaran}</span>
        </div>
        <div className="flex justify-between">
          <span>Bayar:</span>
          <span>{rupiah.format(uangDiterima)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kembali:</span>
          <span>{rupiah.format(kembalian)}</span>
        </div>
      </div>

      <div className="text-center mt-4 pt-2 border-t border-dashed border-black">
        <p className="font-bold">Terima Kasih!</p>
        <p className="text-[9px]">Selamat Menikmati Hidangan Anda</p>
      </div>
    </div>
  );
}