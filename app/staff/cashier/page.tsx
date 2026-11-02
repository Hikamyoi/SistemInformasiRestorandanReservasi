import { Suspense } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageShell from "@/components/landing/PageShell";
import FormKasir from "@/components/staff/FormKasir";

function ambilReservasiBelumBayar() {
  return prisma.reservasi.findMany({
    where: {
      statusPembayaran: "BELUM_BAYAR",
      statusReservasi: { not: "DIBATALKAN" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { nama: true, noHp: true } },
      meja: { select: { nomorMeja: true, lokasiArea: true } },
      detailMenu: {
        include: { menu: { select: { namaMenu: true } } },
      },
    },
  });
}

async function KontenKasir({ idTerpilih }: { idTerpilih?: string }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "STAF" && user.role !== "ADMIN")) {
    redirect("/login?callbackUrl=%2Fstaff%2Fcashier");
  }

  const daftarReservasi = await ambilReservasiBelumBayar();

  return <FormKasir daftarReservasi={daftarReservasi} idTerpilih={idTerpilih} />;
}

export default async function StaffCashierPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <PageShell
      title="Mesin Kasir & Transaksi (POS)"
      subtitle="Kelola pembayaran tagihan makanan dan pencetakan struk transaksi."
      kembali={{ href: "/staff/dashboard", label: "Kembali ke Dashboard Staf" }}
    >
      <div className="max-w-5xl">
        <Suspense fallback={<p className="text-sm text-neutral-500">Memuat data kasir…</p>}>
          <KontenKasir idTerpilih={resolvedParams?.id} />
        </Suspense>
      </div>
    </PageShell>
  );
}