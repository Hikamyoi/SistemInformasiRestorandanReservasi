"use client";

import { useState } from "react";
import Link from "next/link";
import { keluar } from "@/lib/auth-actions";

interface UserSesi {
  userId: string;
  nama: string;
  role: string;
}

/* -------------------------------------------------------------------------- */
/*  Logo Vektor Minimalis Elevenicious (Angka 11 + Garpu & Pisau)             */
/* -------------------------------------------------------------------------- */
function LogoElevenicious() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Ikon Vektor Angka 11 yang membentuk Garpu & Pisau */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500 p-1.5 shadow-sm transition-transform hover:scale-105">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-label="Logo Elevenicious"
        >
          {/* Angka 1 Pertama: Siluet Garpu dengan Sirip Khas Angka 1 */}
          <g fill="#FFFFFF">
            <path d="M35 18V38C35 41.5 37.5 44 41 45V80H45V45C48.5 44 51 41.5 51 38V18H48V34H46V18H44V34H42V18H39V34H37V18H35Z" />
            <path d="M36 40L26 47V53L36 46V40Z" />
          </g>
          {/* Angka 1 Kedua: Siluet Pisau Chef dengan Sirip Khas Angka 1 */}
          <g fill="#FFFFFF">
            <path d="M57 18H62V42L68 56C68 68 63 80 57 80V18Z" />
            <path d="M57 40L48 47V53L57 46V40Z" />
          </g>
        </svg>
      </div>

      {/* Tipografi Brand Elevenicious */}
      <span className="font-[family-name:var(--font-baloo)] text-xl font-extrabold tracking-tight text-neutral-900 leading-none">
        Eleven<span className="text-amber-500">icious</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen Utama Navbar                                                     */
/* -------------------------------------------------------------------------- */
export default function Navbar({ user }: { user: UserSesi | null }) {
  const [bukaMenu, setBukaMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-amber-100/80 bg-[#FFFBF2]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        {/* 1. Logo Baru Elevenicious */}
        <Link href="/" className="inline-flex items-center">
          <LogoElevenicious />
        </Link>

        {/* 2. Menu Tengah (Desktop Only) */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-8 text-xs font-semibold text-neutral-600 md:flex"
        >
          <a href="#layanan" className="transition-colors hover:text-amber-600">
            Layanan
          </a>
          <a href="#menu" className="transition-colors hover:text-amber-600">
            Menu
          </a>
          <a href="#kontak" className="transition-colors hover:text-amber-600">
            Kontak
          </a>
        </nav>

        {/* 3. Aksi Kanan (Desktop Only) */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Pembatas lebar (max-w-[8rem]) & truncate dihapus agar tulisan nama & Pelanggan tampil utuh */}
              <span className="hidden text-xs text-neutral-600 lg:inline whitespace-nowrap">
                Halo,{" "}
                <span className="font-semibold text-neutral-900">
                  {user.nama}
                </span>
              </span>
              <Link
                href={
                  user.role === "STAF" || user.role === "ADMIN"
                    ? "/staff/dashboard"
                    : "/dashboard"
                }
                className="inline-flex items-center text-xs font-semibold text-neutral-700 transition-colors hover:text-amber-600 leading-none"
              >
                Dashboard
              </Link>
              <form
                action={keluar}
                className="inline-flex items-center m-0 p-0"
              >
                <button
                  type="submit"
                  className="inline-flex items-center border-0 bg-transparent p-0 text-xs font-semibold text-neutral-700 transition-colors hover:text-red-600 leading-none cursor-pointer"
                >
                  Keluar
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-xs font-semibold text-neutral-700 transition-colors hover:text-amber-600"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="text-xs font-semibold text-neutral-700 transition-colors hover:text-amber-600"
              >
                Daftar
              </Link>
            </div>
          )}

          <Link
            href="/reservasi"
            className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
          >
            Reservasi Meja
          </Link>
        </div>

        {/* 4. Tombol Hamburger (Khusus Layar HP / Mobile) */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/reservasi"
            className="rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            Reservasi
          </Link>
          <button
            type="button"
            onClick={() => setBukaMenu(!bukaMenu)}
            aria-label="Buka menu navigasi"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-amber-200 bg-white text-neutral-800 transition-colors hover:bg-amber-50"
          >
            {bukaMenu ? (
              <span className="text-lg font-bold">✕</span>
            ) : (
              <span className="text-lg font-bold">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* 5. Dropdown Menu Khusus Mobile saat Hamburger Ditekan */}
      {bukaMenu && (
        <div className="border-t border-amber-100 bg-white px-5 py-5 shadow-xl md:hidden animate-in slide-in-from-top-2">
          {user && (
            <div className="mb-4 pb-3 border-b border-amber-100">
              <p className="text-xs text-neutral-500">Masuk sebagai:</p>
              <p className="font-semibold text-sm text-neutral-900">
                {user.nama}
              </p>
            </div>
          )}

          <nav className="flex flex-col space-y-3 font-medium text-sm text-neutral-700">
            <a
              href="#layanan"
              onClick={() => setBukaMenu(false)}
              className="py-1 hover:text-amber-600"
            >
              Layanan Restoran
            </a>
            <a
              href="#menu"
              onClick={() => setBukaMenu(false)}
              className="py-1 hover:text-amber-600"
            >
              Menu & Hidangan
            </a>
            <a
              href="#kontak"
              onClick={() => setBukaMenu(false)}
              className="py-1 hover:text-amber-600"
            >
              Kontak Kami
            </a>

            <div className="my-2 border-t border-amber-100 pt-3 flex flex-col space-y-3">
              {user ? (
                <>
                  <Link
                    href={
                      user.role === "STAF" || user.role === "ADMIN"
                        ? "/staff/dashboard"
                        : "/dashboard"
                    }
                    onClick={() => setBukaMenu(false)}
                    className="font-semibold text-amber-700"
                  >
                    Buka Dashboard
                  </Link>
                  <form action={keluar}>
                    <button
                      type="submit"
                      className="text-left font-semibold text-red-600 cursor-pointer"
                    >
                      Keluar (Logout)
                    </button>
                  </form>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setBukaMenu(false)}
                    className="rounded-full border border-neutral-300 py-2 text-center text-xs font-semibold text-neutral-800"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    onClick={() => setBukaMenu(false)}
                    className="rounded-full bg-amber-100 py-2 text-center text-xs font-semibold text-amber-800"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
