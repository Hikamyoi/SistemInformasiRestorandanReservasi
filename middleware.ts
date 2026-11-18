// middleware.ts (Proteksi Route Server-Side Next.js - Elevenicious)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "kunci_rahasia_super_aman_projek_resto_2026",
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("auth_token")?.value;

  // ============================================================================
  // 1. RUTE PUBLIK BEBAS AKSES (TANPA PERLU LOGIN)
  // - Halaman Utama: '/'
  // - Reservasi Meja: '/reservasi'
  // - Lacak Pesanan / Kode Booking: '/reservasi/:kode' (e.g. /reservasi/ELV-12345)
  // - Katalog Menu: '/menu'
  // - Autentikasi: '/login', '/register', '/unauthorized'
  // - API Pembuatan Reservasi & Cek Ketersediaan: '/api/reservasi'
  // - API Menu Publik: '/api/menu'
  // ============================================================================
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/reservasi") ||
    pathname.startsWith("/menu") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/api/reservasi") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/menu") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.includes(".");

  // Kecualikan jika rute secara eksplisit mengarah ke panel admin atau staff
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isStaffRoute =
    pathname.startsWith("/staff") ||
    pathname.startsWith("/staf") ||
    pathname.startsWith("/api/staff") ||
    pathname.startsWith("/api/staf");

  if (isPublicRoute && !isAdminRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  // Jika bukan rute yang membutuhkan hak istimewa (admin/staff), loloskan
  if (!isAdminRoute && !isStaffRoute) {
    return NextResponse.next();
  }

  // ============================================================================
  // 2. CEK TOKEN JWT UNTUK RUTE TERPROTEKSI (ADMIN & STAFF)
  // ============================================================================
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak: Silakan login terlebih dahulu",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ============================================================================
  // 3. VERIFIKASI TOKEN JWT & ROLE
  // ============================================================================
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userRole = ((payload.role as string) || "").toUpperCase();

    // Proteksi Route Admin: Khusus Role ADMIN
    if (isAdminRoute && userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak: Khusus Administrator" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Proteksi Route Staff: Khusus Role STAF atau ADMIN
    if (isStaffRoute && userRole !== "STAF" && userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak: Khusus Staf Restoran" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  } catch {
    // Token tidak valid atau sudah kedaluwarsa
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Sesi kedaluwarsa, silakan login kembali" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/staff/:path*",
    "/staf/:path*",
    "/api/admin/:path*",
    "/api/staff/:path*",
    "/api/staf/:path*",
  ],
};
