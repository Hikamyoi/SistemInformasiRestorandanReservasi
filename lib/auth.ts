import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_tim11_resto_key_default",
);

export interface TokenPayload {
  userId: string;
  email: string;
  nama: string;
  role: "PELANGGAN" | "STAF" | "ADMIN";
}

// 1. Buat Token JWT (berlaku 7 hari)
export async function signJWT(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

// 2. Verifikasi Token JWT
export async function verifyJWT(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

// 3. Simpan Token ke HttpOnly Cookie (Aman dari serangan XSS)
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

// 4. Hapus Cookie (Logout)
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

// 5. Ambil data User yang sedang Login di Server
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}
