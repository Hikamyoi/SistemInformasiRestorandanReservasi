import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_tim11_resto_key_default",
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;

  // Tentukan apakah rute ini membutuhkan proteksi
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isStafRoute =
    pathname.startsWith("/staf") || pathname.startsWith("/api/staf");

  if (!isAdminRoute && !isStafRoute) {
    return NextResponse.next();
  }

  // 1. Cek keberadaan token
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses ditolak: Silakan login terlebih dahulu",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Verifikasi Token & Cek Role
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const userRole = payload.role as string;

    // Proteksi Rute ADMIN: Hanya role 'ADMIN' yang diizinkan
    if (isAdminRoute && userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Akses terlarang: Khusus Administrator" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Proteksi Rute STAF: Diizinkan untuk 'STAF' dan 'ADMIN'
    if (isStafRoute && userRole !== "STAF" && userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Akses terlarang: Khusus Staf & Admin" },
          { status: 403 },
        );
      }
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }

    // Tambahkan header user untuk diakses downstream handlers jika diperlukan
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    requestHeaders.set("x-user-role", userRole);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (error) {
    // Token tidak valid atau expired
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Sesi berakhir, silakan login ulang" },
        { status: 401 },
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Konfigurasi matcher rute yang diproteksi
export const config = {
  matcher: [
    "/admin/:path*",
    "/staf/:path*",
    "/api/admin/:path*",
    "/api/staf/:path*",
  ],
};
