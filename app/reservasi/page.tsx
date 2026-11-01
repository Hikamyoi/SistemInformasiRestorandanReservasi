import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import PageShell from "@/components/landing/PageShell";
import ReservationForm from "@/components/ReservationForm";
import { buatReservasi } from "./actions";

async function FormReservasi() {
  const [meja, menu] = await Promise.all([
    prisma.meja.findMany({ orderBy: { nomorMeja: "asc" } }),
    prisma.menu.findMany({
      include: { kategori: true },
      orderBy: [{ kategori: { urutan: "asc" } }, { namaMenu: "asc" }],
    }),
  ]);

  return (
    <ReservationForm
      onSubmit={buatReservasi}
      meja={meja.map((m) => ({
        id: m.id,
        nomorMeja: m.nomorMeja,
        kapasitas: m.kapasitas,
        status: m.status,
        lokasiArea: m.lokasiArea,
      }))}
      menu={menu.map((m) => ({
        id: m.id,
        namaMenu: m.namaMenu,
        harga: Number(m.harga), // Decimal → number (wajib untuk Client Component)
        fotoUrl: m.fotoUrl,
        deskripsi: m.deskripsi,
        statusKetersediaan: m.statusKetersediaan,
        namaKategori: m.kategori.namaKategori,
      }))}
    />
  );
}

export default function ReservasiPage() {
  return (
    <PageShell title="Reservasi Meja" subtitle="Pilih jadwal, meja, dan menu favorit Anda.">
      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat meja dan menu…</p>}>
        <FormReservasi />
      </Suspense>
    </PageShell>
  );
}
