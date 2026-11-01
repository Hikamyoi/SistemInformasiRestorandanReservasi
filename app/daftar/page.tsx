import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/landing/AuthShell";
import RegisterForm from "@/components/RegisterForm";

async function FormDaftar() {
  // Pengguna yang sudah login tidak perlu mendaftar lagi
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <RegisterForm />;
}

export default function DaftarPage() {
  return (
    <AuthShell title="Buat Akun" subtitle="Daftar untuk memesan meja dan memantau reservasi Anda.">
      <Suspense fallback={<p className="text-sm text-neutral-500">Memuat formulir…</p>}>
        <FormDaftar />
      </Suspense>
    </AuthShell>
  );
}
