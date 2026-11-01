import { z } from "zod";

/** Hasil standar Server Action autentikasi. */
export type AksiHasil = { success: boolean; message?: string };

// Nomor HP Indonesia: 08xx..., 628xx..., atau +628xx...
const POLA_HP = /^(\+62|62|0)8[0-9]{7,12}$/;

export const daftarSchema = z
  .object({
    nama: z
      .string()
      .trim()
      .min(2, "Nama minimal 2 karakter.")
      .max(150, "Nama maksimal 150 karakter."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email wajib diisi.")
      .email("Format email tidak valid.")
      .max(255, "Email maksimal 255 karakter."),
    noHp: z
      .string()
      .trim()
      .regex(POLA_HP, "Nomor HP tidak valid. Contoh: 081234567890.")
      .max(20, "Nomor HP maksimal 20 karakter.")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter.")
      .max(72, "Password maksimal 72 karakter.")
      .regex(/[A-Za-z]/, "Password harus mengandung huruf.")
      .regex(/[0-9]/, "Password harus mengandung angka."),
    konfirmasiPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((d) => d.password === d.konfirmasiPassword, {
    path: ["konfirmasiPassword"],
    message: "Konfirmasi password tidak sama.",
  });

export type DaftarValues = z.infer<typeof daftarSchema>;