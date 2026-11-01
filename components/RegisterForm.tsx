"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { daftarSchema, type DaftarValues } from "@/lib/validations/auth";
import { daftarAkun } from "@/app/daftar/actions";

const inputClass =
  "w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm " +
  "placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";
const labelClass = "mb-1.5 block pl-1 text-xs font-semibold text-neutral-700";

function PesanError({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="mt-1.5 pl-1 text-xs font-medium text-red-600">
      {pesan}
    </p>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [pesanServer, setPesanServer] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DaftarValues>({
    resolver: zodResolver(daftarSchema),
    mode: "onTouched",
    defaultValues: { nama: "", email: "", noHp: "", password: "", konfirmasiPassword: "" },
  });

  const kirim = handleSubmit(async (data) => {
    setPesanServer(null);
    try {
      const hasil = await daftarAkun(data);
      if (hasil.success) {
        router.replace("/");
        router.refresh(); // muat ulang agar navigasi menampilkan status login
        return;
      }
      setPesanServer(hasil.message ?? "Pendaftaran gagal.");
    } catch {
      setPesanServer("Terjadi kesalahan jaringan. Silakan coba lagi.");
    }
  });

  return (
    <form onSubmit={kirim} noValidate className="space-y-4">
      <div>
        <label htmlFor="nama" className={labelClass}>Nama lengkap</label>
        <input id="nama" type="text" autoComplete="name" className={inputClass} {...register("nama")} />
        <PesanError pesan={errors.nama?.message} />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>Alamat email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          className={inputClass}
          {...register("email")}
        />
        <PesanError pesan={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="noHp" className={labelClass}>
          Nomor HP <span className="font-normal text-neutral-400">(opsional)</span>
        </label>
        <input
          id="noHp"
          type="tel"
          autoComplete="tel"
          placeholder="081234567890"
          className={inputClass}
          {...register("noHp")}
        />
        <PesanError pesan={errors.noHp?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register("password")}
          />
          <PesanError pesan={errors.password?.message} />
        </div>
        <div>
          <label htmlFor="konfirmasiPassword" className={labelClass}>Ulangi password</label>
          <input
            id="konfirmasiPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register("konfirmasiPassword")}
          />
          <PesanError pesan={errors.konfirmasiPassword?.message} />
        </div>
      </div>
      <p className="pl-1 text-xs text-neutral-500">Password minimal 8 karakter, berisi huruf dan angka.</p>

      {pesanServer && (
        <div role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {pesanServer}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Membuat akun…" : "Buat akun"}
      </button>

      <p className="pt-2 text-center text-sm text-neutral-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-amber-600 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  );
}
