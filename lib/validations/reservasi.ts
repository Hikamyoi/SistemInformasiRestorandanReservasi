import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*  Konstanta bisnis (sesuaikan dengan jam operasional restoran)              */
/* -------------------------------------------------------------------------- */

export const JAM_BUKA = "10:00";
export const JAM_TUTUP = "22:00";
export const MAKS_TAMU = 50;
export const MAKS_JUMLAH_PER_MENU = 99;

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD (format <input type="date">)
const POLA_JAM = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:mm (24 jam, zero-padded)

/** Tanggal hari ini (zona waktu lokal) dalam format YYYY-MM-DD. */
export function tanggalHariIni(): string {
  const d = new Date();
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
}

/** Memastikan string YYYY-MM-DD adalah tanggal kalender yang nyata (bukan 2026-02-31). */
function tanggalValid(nilai: string): boolean {
  const [y, m, d] = nilai.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  );
}

/* -------------------------------------------------------------------------- */
/*  Skema: satu item pesanan  ->  DetailReservasiMenu                         */
/*  (reservasiId & subtotal diisi server; subtotal = harga DB x jumlah)       */
/* -------------------------------------------------------------------------- */

export const pesananMenuSchema = z.object({
  menuId: z
    .string()
    .min(1, "Menu wajib dipilih.")
    .uuid("ID menu tidak valid."),
  jumlah: z
    .number({ message: "Jumlah harus berupa angka." })
    .int("Jumlah harus bilangan bulat.")
    .min(1, "Jumlah minimal 1.")
    .max(MAKS_JUMLAH_PER_MENU, `Jumlah maksimal ${MAKS_JUMLAH_PER_MENU} per menu.`),
  catatanKhusus: z
    .string()
    .max(200, "Catatan khusus maksimal 200 karakter.")
    .optional(),
});

/* -------------------------------------------------------------------------- */
/*  Skema dasar: field input pelanggan  ->  Reservasi                         */
/*  (userId dari sesi login; status & totalBayar diisi/dihitung server)       */
/* -------------------------------------------------------------------------- */

const reservasiDasar = z.object({
  tanggal: z
    .string()
    .min(1, "Tanggal reservasi wajib diisi.")
    .regex(POLA_TANGGAL, "Format tanggal tidak valid.")
    .refine(tanggalValid, "Tanggal tidak valid."),
  jamMulai: z
    .string()
    .min(1, "Jam mulai wajib dipilih.")
    .regex(POLA_JAM, "Format jam mulai tidak valid (HH:mm)."),
  jamSelesai: z
    .string()
    .min(1, "Jam selesai wajib dipilih.")
    .regex(POLA_JAM, "Format jam selesai tidak valid (HH:mm)."),
  jumlahTamu: z
    .number({ message: "Jumlah tamu harus berupa angka." })
    .int("Jumlah tamu harus bilangan bulat.")
    .min(1, "Jumlah tamu minimal 1 orang.")
    .max(MAKS_TAMU, `Jumlah tamu maksimal ${MAKS_TAMU} orang.`),
  mejaId: z
    .string()
    .min(1, "Silakan pilih meja.")
    .uuid("ID meja tidak valid."),
  catatan: z.string().max(500, "Catatan maksimal 500 karakter.").optional(),
  pesanan: z.array(pesananMenuSchema),
});

/* -------------------------------------------------------------------------- */
/*  Factory skema lengkap (dengan aturan lintas-field)                        */
/*                                                                            */
/*  kapasitasMeja (opsional): { [mejaId]: kapasitas } agar jumlah tamu        */
/*  dicek terhadap kapasitas meja yang dipilih. Di server, isi dari DB.       */
/* -------------------------------------------------------------------------- */

export function buatReservasiSchema(kapasitasMeja?: Record<string, number>) {
  return reservasiDasar.superRefine((data, ctx) => {
    // 1. Tanggal tidak boleh di masa lalu (perbandingan string YYYY-MM-DD aman)
    if (POLA_TANGGAL.test(data.tanggal) && data.tanggal < tanggalHariIni()) {
      ctx.addIssue({
        code: "custom",
        path: ["tanggal"],
        message: "Tanggal reservasi tidak boleh sebelum hari ini.",
      });
    }

    // 2. Jam mulai & selesai harus dalam jam operasional
    if (POLA_JAM.test(data.jamMulai) && data.jamMulai < JAM_BUKA) {
      ctx.addIssue({
        code: "custom",
        path: ["jamMulai"],
        message: `Restoran buka mulai pukul ${JAM_BUKA}.`,
      });
    }
    if (POLA_JAM.test(data.jamSelesai) && data.jamSelesai > JAM_TUTUP) {
      ctx.addIssue({
        code: "custom",
        path: ["jamSelesai"],
        message: `Restoran tutup pukul ${JAM_TUTUP}.`,
      });
    }

    // 3. Jam selesai harus setelah jam mulai
    if (
      POLA_JAM.test(data.jamMulai) &&
      POLA_JAM.test(data.jamSelesai) &&
      data.jamSelesai <= data.jamMulai
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["jamSelesai"],
        message: "Jam selesai harus lebih akhir dari jam mulai.",
      });
    }

    // 4. Jumlah tamu tidak boleh melebihi kapasitas meja
    const kapasitas = kapasitasMeja?.[data.mejaId];
    if (kapasitas !== undefined && data.jumlahTamu > kapasitas) {
      ctx.addIssue({
        code: "custom",
        path: ["jumlahTamu"],
        message: `Meja ini hanya muat ${kapasitas} orang. Kurangi jumlah tamu atau pilih meja lain.`,
      });
    }

    // 5. Menu yang sama tidak boleh muncul dua kali
    const terlihat = new Set<string>();
    data.pesanan.forEach((item, index) => {
      if (terlihat.has(item.menuId)) {
        ctx.addIssue({
          code: "custom",
          path: ["pesanan", index, "menuId"],
          message: "Menu ini sudah ada di pesanan. Ubah jumlahnya saja.",
        });
      }
      terlihat.add(item.menuId);
    });
  });
}

/** Skema statis (tanpa cek kapasitas) — cocok untuk validasi dasar. */
export const reservasiSchema = buatReservasiSchema();

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                      */
/* -------------------------------------------------------------------------- */

/** Bentuk data yang dikirim ke Server Action / API Route. */
export type ReservasiFormValues = z.infer<typeof reservasiSchema>;
export type PesananMenuValues = z.infer<typeof pesananMenuSchema>;

/** Hasil standar yang dikembalikan Server Action. */
export type ReservasiActionResult = {
  success: boolean;
  message?: string;
};