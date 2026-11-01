"use server";

import { redirect } from "next/navigation";
import { removeAuthCookie } from "@/lib/auth";

/** Hapus cookie sesi lalu kembali ke landing page. */
export async function keluar(): Promise<void> {
  await removeAuthCookie();
  redirect("/");
}