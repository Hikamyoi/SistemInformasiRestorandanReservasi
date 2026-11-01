import AuthShell from "@/components/landing/AuthShell";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell title="Selamat Datang" subtitle="Masuk untuk memesan meja dan memantau reservasi Anda.">
      <LoginForm />
    </AuthShell>
  );
}
