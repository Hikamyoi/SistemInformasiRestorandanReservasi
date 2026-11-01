"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Piring from "@/components/landing/Piring";

export type ItemMenu = {
  id: string;
  nama: string;
  harga: number;
  foto: string | null;
  deskripsi: string | null;
  tersedia: boolean;
  kategori: string;
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const judul = "font-[family-name:var(--font-baloo)]";

function Kartu({ item }: { item: ItemMenu }) {
  return (
    <article className="flex h-full w-full flex-col items-center rounded-3xl bg-white p-4 text-center shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)]">
      <Piring foto={item.foto} nama={item.nama} className="w-32" />
      <h3 className={`${judul} mt-4 text-lg font-bold text-neutral-900`}>{item.nama}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-neutral-500">
        {item.deskripsi ?? item.kategori}
      </p>
      <div className="mt-auto flex w-full items-center justify-between pt-4">
        <span className="text-sm font-semibold text-neutral-900">{rupiah.format(item.harga)}</span>
        {item.tersedia ? (
          <Link
            href="/reservasi"
            className="rounded-full border border-neutral-300 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 transition-colors hover:border-amber-500 hover:bg-amber-500 hover:text-white"
          >
            Pesan
          </Link>
        ) : (
          <span className="text-xs font-medium text-red-500">Habis</span>
        )}
      </div>
    </article>
  );
}

/* ----------------------------- Menu Populer ------------------------------ */

export function PopularDishes({ items }: { items: ItemMenu[] }) {
  const baris = useRef<HTMLDivElement>(null);
  const geser = (arah: 1 | -1) => baris.current?.scrollBy({ left: arah * 300, behavior: "smooth" });

  if (items.length === 0) return null;

  return (
    <section id="populer" className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex items-center justify-between">
        <h2 className={`${judul} text-3xl font-bold text-neutral-900`}>Menu Populer</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => geser(-1)}
            aria-label="Geser ke kiri"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-400 text-amber-600 hover:bg-amber-50"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => geser(1)}
            aria-label="Geser ke kanan"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600"
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={baris}
        className="mt-8 flex snap-x gap-5 overflow-x-auto px-1 pb-6 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className="w-56 shrink-0 snap-start">
            <Kartu item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------- Menu per Kategori --------------------------- */

export function MenuTabs({ kategori, items }: { kategori: string[]; items: ItemMenu[] }) {
  const [aktif, setAktif] = useState("Semua");
  const tab = ["Semua", ...kategori];
  const tampil = aktif === "Semua" ? items : items.filter((i) => i.kategori === aktif);

  return (
    <section id="menu" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-14">
      <h2 className={`${judul} text-center text-3xl font-bold text-neutral-900`}>Menu Reguler Kami</h2>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {tab.map((nama) => (
          <button
            key={nama}
            type="button"
            onClick={() => setAktif(nama)}
            aria-pressed={aktif === nama}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              aktif === nama
                ? "bg-amber-500 text-white"
                : "border border-neutral-300 text-neutral-600 hover:border-amber-400"
            }`}
          >
            {nama}
          </button>
        ))}
      </div>

      {tampil.length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">Menu sedang disiapkan. Silakan kembali lagi nanti.</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tampil.map((item) => (
            <Kartu key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
