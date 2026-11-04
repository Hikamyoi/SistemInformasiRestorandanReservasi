import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PageShell from "@/components/landing/PageShell";
import FormKasir from "@/components/staff/FormKasir";

async function ambilReservasiBelumBayar() {
  const data = await prisma.reservasi.findMany({
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

  // Konversi Decimal Prisma menjadi number biasa untuk Client Component
  return data.map((r) => ({
    ...r,
    totalBayar: Number(r.totalBayar),
    detailMenu: r.detailMenu.map((d) => ({
      ...d,
      subtotal: Number(d.subtotal),
    })),
  }));
}

async function KontenKasir({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  // Memberitahu Next.js bahwa komponen ini berjalan saat ada request dinamis
  await connection();

  const user = await getCurrentUser();
  if (!user || (user.role !== "STAF" && user.role !== "ADMIN")) {
    redirect("/login?callbackUrl=%2Fstaff%2Fcashier");
  }

  // Await searchParams di dalam Suspense
  const resolvedParams = await searchParams;
  const daftarReservasi = await ambilReservasiBelumBayar();

  return (
    <FormKasir
      daftarReservasi={daftarReservasi}
      idTerpilih={resolvedParams?.id}
    />
  );
}

export default function StaffCashierPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  return (
    <PageShell
      title="Mesin Kasir & Transaksi (POS)"
      subtitle="Kelola pembayaran tagihan makanan dan pencetakan struk transaksi."
      kembali={{ href: "/staff/dashboard", label: "Kembali ke Dashboard Staf" }}
    >
      <div className="max-w-5xl">
        <Suspense
          fallback={
            <p className="text-sm text-neutral-500">Memuat data kasir…</p>
          }
        >
          <KontenKasir searchParams={searchParams} />
        </Suspense>
      </div>
    </PageShell>
  );
}
