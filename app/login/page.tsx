import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/landing/AuthShell";
import LoginForm from "@/components/LoginForm";

// Memberitahu Next.js 16 bahwa rute ini sengaja menunggu pengecekan sesi (blocking) sebelum render
export const instant = false;

export default async function LoginPage() {
  // 1. Cek sesi user saat ini
  const user = await getCurrentUser();

  // 2. Jika user sudah login, langsung arahkan berdasarkan role-nya
  if (user) {
    if (user.role === "STAF" || user.role === "ADMIN") {
      redirect("/staff/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <AuthShell
      title="Selamat Datang"
      subtitle="Masuk untuk memesan meja dan memantau reservasi Anda."
    >
      <LoginForm />
    </AuthShell>
  );
}
