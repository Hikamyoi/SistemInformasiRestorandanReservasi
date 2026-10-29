"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
    } catch (err: any) {
      setErrorMsg(err.message);
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        {/* Header Form */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xl mb-3 border border-emerald-500/30">
            🍽️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            RestoReserve
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sistem Informasi Restoran & Reservasi
          </p>
        </div>

        {/* Notifikasi Error */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
            ⚠️ <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Alamat Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {loading ? "Memproses Masuk..." : "Masuk ke Sistem"}
          </button>
        </form>

        {/* Tombol Cepat Akun Dummy (Sesuai seed.js Database) */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-3">
            Akun Percobaan (Sesuai seed.js):
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials("admin@resto.com", "Password123!")}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-center font-medium transition cursor-pointer"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("staf@resto.com", "Password123!")}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-center font-medium transition cursor-pointer"
            >
              🧑‍🍳 Staf
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("andi@gmail.com", "Password123!")}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-center font-medium transition cursor-pointer"
            >
              🙋 Pelanggan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
