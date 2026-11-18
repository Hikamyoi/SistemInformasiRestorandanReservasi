"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Briefcase, User } from "lucide-react";

const inputClass =
  "w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm " +
  "placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";
const labelClass = "mb-1.5 block pl-1 text-xs font-semibold text-neutral-700";

const AKUN_DEMO = [
  {
    key: "ADMIN",
    label: "Admin",
    sublabel: "Panel Admin",
    email: "admin@resto.com",
    password: "Password123!",
    ikon: ShieldCheck,
    warnaIcon: "bg-amber-100 text-amber-700",
  },
  {
    key: "STAF",
    label: "Staf",
    sublabel: "Kasir & POS",
    email: "staf@resto.com",
    password: "Password123!",
    ikon: Briefcase,
    warnaIcon: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "PELANGGAN",
    label: "Pelanggan",
    sublabel: "Akun Tamu",
    email: "andi@gmail.com",
    password: "Password123!",
    ikon: User,
    warnaIcon: "bg-sky-100 text-sky-700",
  },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const lakukanLogin = async (
    targetEmail: string,
    targetPassword: string,
    roleDemo?: string,
  ) => {
    setLoading(true);
    setLoadingRole(roleDemo || null);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          password: targetPassword,
        }),
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

      if (data.user?.role === "STAF") {
        router.push("/staff/dashboard");
      } else if (callbackUrl) {
        router.push(callbackUrl);
      } else if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/");
      }

      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan. Silakan coba lagi.",
      );
    } finally {
      setLoading(false);
      setLoadingRole(null);
    }
  };

  // Fungsi pengiriman form login manual ke API backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await lakukanLogin(email, password);
  };

  // Fungsi login otomatis sekali klik untuk akun demo
  const handleQuickLogin = async (akun: (typeof AKUN_DEMO)[number]) => {
    setEmail(akun.email);
    setPassword(akun.password);
    await lakukanLogin(akun.email, akun.password, akun.key);
  };

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
          <label htmlFor="email" className={labelClass}>
            Alamat email
          </label>
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

        {/* Input Password dengan Tombol Mata Show/Hide */}
        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} !pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? "Sembunyikan password" : "Lihat password"
              }
              className="absolute right-4 flex h-6 w-6 cursor-pointer items-center justify-center text-neutral-400 transition-colors hover:text-neutral-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading && !loadingRole ? "Memproses masuk…" : "Masuk"}
        </button>
      </form>

      {/* Tombol Login Otomatis (Demo 1-Klik untuk Admin, Staf, Pelanggan) */}
      <div className="mt-6">
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-amber-200/80" />
          <span className="shrink-0 bg-[#FFFBF2] px-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Login Cepat (Demo)
          </span>
          <div className="w-full border-t border-amber-200/80" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {AKUN_DEMO.map((akun) => {
            const Icon = akun.ikon;
            const sedangMemuat = loadingRole === akun.key;

            return (
              <button
                key={akun.key}
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin(akun)}
                title={`Masuk otomatis sebagai ${akun.label} (${akun.email})`}
                className="group flex cursor-pointer flex-col items-center rounded-2xl border border-amber-200/80 bg-white px-2.5 py-2.5 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50/70 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span
                  className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-full ${akun.warnaIcon}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-bold text-neutral-900">
                  {sedangMemuat ? "Masuk…" : akun.label}
                </span>
                <span className="mt-0.5 text-[10px] text-neutral-500">
                  {akun.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-neutral-500">
        Belum punya akun?{" "}
        <Link
          href="/daftar"
          className="font-semibold text-amber-600 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </>
  );
}
