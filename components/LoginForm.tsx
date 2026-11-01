"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm " +
  "placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";
const labelClass = "mb-1.5 block pl-1 text-xs font-semibold text-neutral-700";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Fungsi pengiriman form login ke API backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Gagal login, periksa kembali email & password",
        );
      }

      // Cek apakah ada callbackUrl di URL (misal diarahkan dari /admin)
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl");

      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else if (data.user?.role === "STAF") {
        router.push("/staf");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk mengisi cepat data akun dummy hasil seed
  const fillCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setErrorMsg("");
  };

  const chipAkun =
    "rounded-full border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition-colors hover:border-amber-500 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

  return (
    <>
      {/* Notifikasi Error */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-5 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          ⚠️ <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Login */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className={labelClass}>Alamat email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Memproses masuk…" : "Masuk ke sistem"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-amber-600 hover:underline">
          Daftar
        </Link>
      </p>

      {/* Tombol cepat akun dummy (sesuai seed.js database) */}
      <div className="mt-8 border-t border-amber-100 pt-6">
        <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
          Akun percobaan (sesuai seed.js)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => fillCredentials("admin@resto.com", "Password123!")} className={chipAkun}>
            👑 Admin
          </button>
          <button type="button" onClick={() => fillCredentials("staf@resto.com", "Password123!")} className={chipAkun}>
            🧑‍🍳 Staf
          </button>
          <button type="button" onClick={() => fillCredentials("andi@gmail.com", "Password123!")} className={chipAkun}>
            🙋 Pelanggan
          </button>
        </div>
      </div>
    </>
  );
}
