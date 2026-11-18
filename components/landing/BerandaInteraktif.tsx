"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  UtensilsCrossed,
  Wind,
  Trees,
  Sparkles,
  Users,
} from "lucide-react";

export interface SlideMakanan {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  deskripsi: string;
  foto?: string | null;
}

const SLIDE_CADANGAN: SlideMakanan[] = [
  {
    id: "default-1",
    nama: "Kami Sajikan Rasa yang Anda Suka",
    kategori: "Hidangan Spesial Elevenicious",
    harga: 0,
    deskripsi:
      "Nikmati ragam hidangan Nusantara & western pilihan yang dimasak segar. Pesan meja lebih awal dan pre-order menu favorit Anda tanpa antre.",
    foto: null,
  },
];

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

interface HeroSliderProps {
  jamBuka: string;
  jamTutup: string;
  namaKategori: string[];
  slidesMakanan: SlideMakanan[];
  judulClassName: string;
  tombolClassName: string;
}

export function HeroSlider({
  jamBuka,
  jamTutup,
  namaKategori,
  slidesMakanan,
  judulClassName,
  tombolClassName,
}: HeroSliderProps) {
  const daftarSlide = slidesMakanan.length > 0 ? slidesMakanan : SLIDE_CADANGAN;

  const [aktifIndex, setAktifIndex] = useState(0);
  const [dijeda, setDijeda] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  const indexAman = aktifIndex % daftarSlide.length;

  useEffect(() => {
    if (dijeda || daftarSlide.length <= 1) return;
    const timer = setInterval(() => {
      setAktifIndex((prev) => (prev + 1) % daftarSlide.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [dijeda, daftarSlide.length]);

  const geser = (arah: number) => {
    setAktifIndex(
      (prev) => (prev + arah + daftarSlide.length) % daftarSlide.length,
    );
  };

  const slideSekarang = daftarSlide[indexAman];

  return (
    <section
      className="mx-auto max-w-6xl px-5 pb-10 pt-6 lg:pt-10"
      onMouseEnter={() => setDijeda(true)}
      onMouseLeave={() => setDijeda(false)}
    >
      <div className="relative overflow-hidden rounded-[2rem] bg-amber-50/80 ring-1 ring-amber-100 p-6 sm:p-10 lg:p-12">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Kolom Kiri: Copywriting Menu Makanan Aktif + CTA */}
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Menu Pilihan · {slideSekarang.kategori} · Buka {jamBuka}–
              {jamTutup} WIB
            </p>

            <h1
              className={`${judulClassName} mt-2.5 text-3xl font-extrabold leading-[1.15] text-neutral-900 sm:text-5xl text-balance`}
            >
              {slideSekarang.nama}
            </h1>

            <p className="mt-4 max-w-md text-sm leading-7 text-neutral-600">
              {slideSekarang.deskripsi}
            </p>

            {slideSekarang.harga > 0 && (
              <p className="mt-3 text-base font-extrabold text-amber-600 tabular-nums">
                {rupiah.format(slideSekarang.harga)}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/reservasi"
                className={`${tombolClassName} inline-flex items-center gap-2`}
              >
                <CalendarCheck className="h-4 w-4" />
                <span>Pesan Meja Sekarang</span>
              </Link>
              <a
                href="#menu"
                className="rounded-full border border-amber-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:bg-amber-50"
              >
                Lihat Menu
              </a>
            </div>

            {/* Navigasi Slide (Panah + Indikator) */}
            {daftarSlide.length > 1 && (
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => geser(-1)}
                    aria-label="Menu sebelumnya"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-white text-neutral-700 transition hover:bg-amber-100 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => geser(1)}
                    aria-label="Menu berikutnya"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 bg-white text-neutral-700 transition hover:bg-amber-100 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {daftarSlide.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setAktifIndex(idx)}
                      aria-label={`Slide ${idx + 1}: ${slide.nama}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === indexAman
                          ? "w-7 bg-amber-500"
                          : "w-2 bg-amber-200 hover:bg-amber-300"
                      }`}
                    />
                  ))}
                </div>

                <span className="text-xs font-mono font-semibold text-neutral-500 tabular-nums">
                  0{indexAman + 1}/0{daftarSlide.length}
                </span>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Slider Foto Makanan + Shortcut Kategori */}
          <div className="relative">
            <div className="relative h-72 sm:h-80 lg:h-[360px] w-full overflow-hidden rounded-3xl shadow-[0_20px_45px_-15px_rgba(120,80,0,0.28)] ring-1 ring-amber-200/70">
              {daftarSlide.map((slide, idx) => {
                const aktif = idx === indexAman;
                const urlFoto =
                  slide.foto && !failedUrls[slide.foto] ? slide.foto : "";

                return (
                  <div
                    key={slide.id}
                    aria-hidden={!aktif}
                    className={`absolute inset-0 transition-all duration-700 ease-out ${
                      aktif
                        ? "opacity-100 scale-100 z-10"
                        : "opacity-0 scale-105 z-0 pointer-events-none"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-stone-900 to-neutral-950" />
                    {urlFoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={urlFoto}
                        alt={slide.nama}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedUrls((prev) => ({
                            ...prev,
                            [urlFoto]: true,
                          }))
                        }
                        className="relative h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative flex h-full w-full items-center justify-center text-amber-300/60">
                        <UtensilsCrossed className="h-16 w-16" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3 text-white">
                      <div>
                        <p className="text-xs font-semibold text-amber-300">
                          {slide.kategori}
                        </p>
                        <p className="text-base font-bold">{slide.nama}</p>
                      </div>
                      {slide.harga > 0 && (
                        <span className="shrink-0 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
                          {rupiah.format(slide.harga)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shortcut Kategori Menu */}
            {namaKategori.length > 0 && (
              <ul className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                {namaKategori.slice(0, 5).map((nama) => (
                  <li key={nama}>
                    <a
                      href="#menu"
                      className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-neutral-700 shadow-xs ring-1 ring-amber-100 transition-all hover:text-amber-600"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                        {nama.charAt(0).toUpperCase()}
                      </span>
                      <span>{nama}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function RevealSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const raf = requestAnimationFrame(() => setTerlihat(true));
      return () => cancelAnimationFrame(raf);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTerlihat(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0 ${
        terlihat ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

const FOTO_INDOOR_UNSPLASH =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80";
const FOTO_OUTDOOR_UNSPLASH =
  "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=1000&auto=format&fit=crop&q=80";

export function GaleriRuangan({ judulClassName }: { judulClassName: string }) {
  const [gagalIndoor, setGagalIndoor] = useState(false);
  const [gagalOutdoor, setGagalOutdoor] = useState(false);

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {/* Kartu Zona 1: Indoor Non-Smoking & VIP */}
      <div className="group overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_-15px_rgba(120,80,0,0.22)] ring-1 ring-amber-100">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-amber-900 via-stone-900 to-neutral-950">
          {!gagalIndoor && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FOTO_INDOOR_UNSPLASH}
              alt="Suasana Indoor Non-Smoking dan Ruang VIP Elevenicious"
              referrerPolicy="no-referrer"
              onError={() => setGagalIndoor(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur-xs">
                <Wind className="h-3.5 w-3.5" />
                Bebas Asap Rokok · Full AC
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/85 px-3 py-1 text-[11px] font-semibold text-white">
                <Users className="h-3.5 w-3.5" />5 Meja (2–8 Kursi)
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-300">
                Zona Indoor &amp; Ruang Privat
              </p>
              <h3 className={`${judulClassName} mt-0.5 text-2xl font-bold`}>
                Indoor Non-Smoking &amp; VIP Room
              </h3>
              <p className="mt-1 text-xs text-neutral-200">
                Meja Jendela Street View · Hall Barista · Sudut Keluarga ·
                VIP-01
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <p className="text-xs leading-5 text-neutral-600">
            Suasana tenang dengan pencahayaan hangat dan pendingin ruangan
            sejuk, ideal untuk bersantap keluarga maupun meeting privat.
          </p>
          <Link
            href="/reservasi"
            className="shrink-0 text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Pilih Meja &rarr;
          </Link>
        </div>
      </div>

      {/* Kartu Zona 2: Outdoor Smoking & Garden Terrace */}
      <div className="group overflow-hidden rounded-3xl bg-white shadow-[0_12px_30px_-15px_rgba(120,80,0,0.22)] ring-1 ring-amber-100">
        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-950 via-stone-900 to-neutral-950">
          {!gagalOutdoor && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={FOTO_OUTDOOR_UNSPLASH}
              alt="Suasana Outdoor Smoking Garden Terrace Elevenicious"
              referrerPolicy="no-referrer"
              onError={() => setGagalOutdoor(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

          <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-xs">
                <Trees className="h-3.5 w-3.5" />
                Udara Terbuka · Smoking Area
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/85 px-3 py-1 text-[11px] font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" />3 Meja Teras
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-emerald-300">
                Zona Terbuka &amp; Taman Hijau
              </p>
              <h3 className={`${judulClassName} mt-0.5 text-2xl font-bold`}>
                Outdoor Smoking &amp; Garden Terrace
              </h3>
              <p className="mt-1 text-xs text-neutral-200">
                Dekat Taman Hijau · Area Kanopi Semi-Terbuka · Teras Senja
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <p className="text-xs leading-5 text-neutral-600">
            Nikmati hembusan angin alami di teras taman semi-terbuka yang teduh
            dan santai untuk ngopi sore maupun makan malam.
          </p>
          <Link
            href="/reservasi"
            className="shrink-0 text-xs font-bold text-amber-600 hover:text-amber-700"
          >
            Pilih Meja &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
