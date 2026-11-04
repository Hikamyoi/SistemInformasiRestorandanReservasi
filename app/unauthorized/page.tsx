import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-3xl font-bold text-red-500 mb-2">
        Akses Ditolak (403)
      </h1>
      <p className="mb-4 text-gray-400">
        Anda tidak memiliki hak akses untuk membuka halaman ini.
      </p>
      <Link
        href="/login"
        className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
      >
        Kembali ke Login
      </Link>
    </div>
  );
}
