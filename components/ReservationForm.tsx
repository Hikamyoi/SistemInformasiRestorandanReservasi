"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  buatReservasiSchema,
  JAM_BUKA,
  JAM_TUTUP,
  MAKS_JUMLAH_PER_MENU,
  tanggalHariIni,
  type ReservasiActionResult,
  type ReservasiFormValues,
} from "@/lib/validations/reservasi";

/* -------------------------------------------------------------------------- */
/*  Tipe props                                                                */
/*  Decimal (Prisma) & Date tidak bisa dikirim Server -> Client Component,    */
/*  jadi `harga` harus sudah dikonversi ke number di server (Number(harga)).  */
/* -------------------------------------------------------------------------- */

export type MejaOption = {
  id: string;
  nomorMeja: string;
  kapasitas: number;
  status: "TERSEDIA" | "DIISI" | "DIBLOKIR";
  lokasiArea: string;
};

export type MenuOption = {
  id: string;
  namaMenu: string;
  harga: number;
  fotoUrl: string | null;
  deskripsi: string | null;
  statusKetersediaan: boolean;
  namaKategori?: string;
};

type Props = {
  meja: MejaOption[];
  menu: MenuOption[];
  /** Server Action: menerima data tervalidasi, mengembalikan hasil. */
  onSubmit?: (data: ReservasiFormValues) => Promise<ReservasiActionResult>;
};

/* -------------------------------------------------------------------------- */
/*  Helper                                                                    */
/* -------------------------------------------------------------------------- */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Slot jam per 30 menit dalam jam operasional. */
function buatSlotJam(): string[] {
  const slot: string[] = [];
  const [jb, mb] = JAM_BUKA.split(":").map(Number);
  const [jt, mt] = JAM_TUTUP.split(":").map(Number);
  for (let menit = jb * 60 + mb; menit <= jt * 60 + mt; menit += 30) {
    const h = String(Math.floor(menit / 60)).padStart(2, "0");
    const m = String(menit % 60).padStart(2, "0");
    slot.push(`${h}:${m}`);
  }
  return slot;
}
const SLOT_JAM = buatSlotJam();

const fontJudul = "font-[family-name:var(--font-baloo)]";

const inputClass =
  "w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 shadow-sm " +
  "placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 " +
  "focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:bg-neutral-100";
const areaClass = inputClass.replace("rounded-full", "rounded-2xl");
const labelClass = "mb-1.5 block pl-1 text-xs font-semibold text-neutral-700";

function PesanError({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="mt-1.5 pl-1 text-xs font-medium text-red-600">
      {pesan}
    </p>
  );
}

function Bagian({
  judul,
  deskripsi,
  children,
}: {
  judul: string;
  deskripsi?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)] sm:p-7">
      <h2 className={`${fontJudul} text-xl font-bold text-neutral-900`}>{judul}</h2>
      {deskripsi && <p className="mt-1 text-sm text-neutral-500">{deskripsi}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen utama                                                            */
/* -------------------------------------------------------------------------- */

export default function ReservationForm({ meja, menu, onSubmit }: Props) {
  const [hasilServer, setHasilServer] = useState<ReservasiActionResult | null>(null);
  const [minTanggal, setMinTanggal] = useState(""); // diisi di client agar tidak hydration mismatch

  // Skema dengan cek kapasitas meja
  const schema = useMemo(
    () =>
      buatReservasiSchema(
        Object.fromEntries(meja.map((m) => [m.id, m.kapasitas]))
      ),
    [meja]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReservasiFormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      tanggal: "",
      jamMulai: "",
      jamSelesai: "",
      jumlahTamu: 2,
      mejaId: "",
      catatan: "",
      pesanan: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "pesanan" });

  useEffect(() => setMinTanggal(tanggalHariIni()), []);

  const pesanan = watch("pesanan");
  const jamMulai = watch("jamMulai");
  const jamSelesai = watch("jamSelesai");
  const mejaId = watch("mejaId");
  const jumlahTamu = watch("jumlahTamu");

  // Reset jam selesai bila tidak lagi valid setelah jam mulai diganti
  useEffect(() => {
    if (jamMulai && jamSelesai && jamSelesai <= jamMulai) {
      setValue("jamSelesai", "");
    }
  }, [jamMulai, jamSelesai, setValue]);

  const peta = useMemo(() => new Map(menu.map((m) => [m.id, m])), [menu]);

  /* ----- Kalkulasi real-time estimasi totalBayar ----- */
  const totalBayar = useMemo(
    () =>
      (pesanan ?? []).reduce((total, item) => {
        const harga = peta.get(item.menuId)?.harga ?? 0;
        const jumlah = Number.isFinite(item.jumlah) ? item.jumlah : 0;
        return total + harga * jumlah;
      }, 0),
    [pesanan, peta]
  );
  const totalItem = (pesanan ?? []).reduce((n, i) => n + (i.jumlah || 0), 0);

  const jumlahDi = (menuId: string) =>
    pesanan?.find((p) => p.menuId === menuId)?.jumlah ?? 0;

  function ubahJumlah(menuId: string, delta: 1 | -1) {
    const index = pesanan.findIndex((p) => p.menuId === menuId);
    if (index === -1) {
      if (delta === 1) append({ menuId, jumlah: 1, catatanKhusus: "" });
      return;
    }
    const baru = pesanan[index].jumlah + delta;
    if (baru <= 0) remove(index);
    else if (baru <= MAKS_JUMLAH_PER_MENU)
      setValue(`pesanan.${index}.jumlah`, baru, { shouldValidate: true });
  }

  /* ----- Kelompokkan menu per kategori ----- */
  const menuPerKategori = useMemo(() => {
    const grup = new Map<string, MenuOption[]>();
    for (const m of menu) {
      const kunci = m.namaKategori ?? "Menu";
      grup.set(kunci, [...(grup.get(kunci) ?? []), m]);
    }
    return Array.from(grup.entries());
  }, [menu]);

  const mejaTerpilih = meja.find((m) => m.id === mejaId);
  const slotSelesai = SLOT_JAM.filter((j) => !jamMulai || j > jamMulai);

  /* ----- Submit ----- */
  const kirim = handleSubmit(async (data) => {
    setHasilServer(null);

    // Bersihkan string kosong agar server menerima data rapi
    const payload: ReservasiFormValues = {
      ...data,
      catatan: data.catatan?.trim() || undefined,
      pesanan: data.pesanan.map((p) => ({
        ...p,
        catatanKhusus: p.catatanKhusus?.trim() || undefined,
      })),
    };

    try {
      const hasil = onSubmit
        ? await onSubmit(payload)
        : { success: true, message: "Mode demo: data berikut siap dikirim ke server." };
      if (!onSubmit) console.log("Payload reservasi:", payload);

      setHasilServer(hasil);
      if (hasil.success) reset();
    } catch {
      setHasilServer({
        success: false,
        message: "Terjadi kesalahan jaringan. Silakan coba lagi.",
      });
    }
  });

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <form onSubmit={kirim} noValidate className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {/* ---------------- Jadwal ---------------- */}
        <Bagian
          judul="Jadwal kunjungan"
          deskripsi={`Restoran buka pukul ${JAM_BUKA}–${JAM_TUTUP}.`}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="tanggal" className={labelClass}>Tanggal</label>
              <input id="tanggal" type="date" min={minTanggal} className={inputClass} {...register("tanggal")} />
              <PesanError pesan={errors.tanggal?.message} />
            </div>

            <div>
              <label htmlFor="jamMulai" className={labelClass}>Jam mulai</label>
              <select id="jamMulai" className={inputClass} {...register("jamMulai")}>
                <option value="">Pilih jam</option>
                {SLOT_JAM.slice(0, -1).map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <PesanError pesan={errors.jamMulai?.message} />
            </div>

            <div>
              <label htmlFor="jamSelesai" className={labelClass}>Jam selesai</label>
              <select id="jamSelesai" className={inputClass} disabled={!jamMulai} {...register("jamSelesai")}>
                <option value="">{jamMulai ? "Pilih jam" : "Pilih jam mulai dulu"}</option>
                {slotSelesai.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
              <PesanError pesan={errors.jamSelesai?.message} />
            </div>

            <div>
              <label htmlFor="jumlahTamu" className={labelClass}>Jumlah tamu</label>
              <input
                id="jumlahTamu"
                type="number"
                min={1}
                inputMode="numeric"
                className={inputClass}
                {...register("jumlahTamu", { valueAsNumber: true })}
              />
              <PesanError pesan={errors.jumlahTamu?.message} />
            </div>
          </div>
        </Bagian>

        {/* ---------------- Meja ---------------- */}
        <Bagian judul="Pilih meja" deskripsi="Meja yang diblokir tidak bisa dipesan.">
          <div role="radiogroup" aria-label="Pilih meja" className="grid gap-3 sm:grid-cols-2">
            {meja.map((m) => {
              const diblokir = m.status === "DIBLOKIR";
              const terpilih = mejaId === m.id;
              const kurang = jumlahTamu > m.kapasitas;
              return (
                <label
                  key={m.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors",
                    terpilih
                      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                      : "border-neutral-200 hover:border-amber-300",
                    diblokir ? "cursor-not-allowed opacity-50" : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    value={m.id}
                    disabled={diblokir}
                    className="mt-1 accent-amber-500"
                    {...register("mejaId")}
                  />
                  <span className="min-w-0">
                    <span className={`${fontJudul} block text-base font-bold text-neutral-900`}>Meja {m.nomorMeja}</span>
                    <span className="block text-sm text-neutral-500">
                      {m.lokasiArea} · {m.kapasitas} orang
                    </span>
                    {diblokir && <span className="mt-1 block text-xs text-neutral-500">Tidak tersedia</span>}
                    {!diblokir && kurang && (
                      <span className="mt-1 block text-xs text-amber-700">Kapasitas kurang dari jumlah tamu</span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {meja.length === 0 && (
            <p className="text-sm text-neutral-500">Belum ada meja yang bisa dipilih.</p>
          )}
          <PesanError pesan={errors.mejaId?.message} />
        </Bagian>

        {/* ---------------- Menu ---------------- */}
        <Bagian
          judul="Pesan menu lebih awal"
          deskripsi="Opsional. Makanan disiapkan agar siap saat Anda tiba."
        >
          {menuPerKategori.length === 0 && (
            <p className="text-sm text-neutral-500">Menu belum tersedia.</p>
          )}
          <div className="space-y-7">
            {menuPerKategori.map(([kategori, daftar]) => (
              <div key={kategori}>
                <h3 className={`${fontJudul} mb-3 text-base font-bold text-neutral-800`}>{kategori}</h3>
                <ul className="divide-y divide-amber-100 rounded-2xl border border-amber-100">
                  {daftar.map((m) => {
                    const jumlah = jumlahDi(m.id);
                    return (
                      <li key={m.id} className="flex items-center gap-4 p-3.5">
                        {m.fotoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.fotoUrl}
                            alt={m.namaMenu}
                            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-amber-100"
                          />
                        ) : (
                          <div
                            aria-hidden
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl"
                          >
                            🍽️
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-neutral-900">{m.namaMenu}</p>
                          {m.deskripsi && (
                            <p className="line-clamp-1 text-xs text-neutral-500">{m.deskripsi}</p>
                          )}
                          <p className="mt-0.5 text-sm font-semibold text-amber-600">{rupiah.format(m.harga)}</p>
                        </div>

                        {m.statusKetersediaan ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => ubahJumlah(m.id, -1)}
                              disabled={jumlah === 0}
                              aria-label={`Kurangi ${m.namaMenu}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:border-amber-500 hover:text-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                              {jumlah}
                            </span>
                            <button
                              type="button"
                              onClick={() => ubahJumlah(m.id, 1)}
                              disabled={jumlah >= MAKS_JUMLAH_PER_MENU}
                              aria-label={`Tambah ${m.namaMenu}`}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-red-500">Habis</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {typeof errors.pesanan?.message === "string" && (
            <PesanError pesan={errors.pesanan.message} />
          )}
        </Bagian>

        {/* ---------------- Catatan ---------------- */}
        <Bagian judul="Catatan untuk restoran">
          <label htmlFor="catatan" className="sr-only">Catatan reservasi</label>
          <textarea
            id="catatan"
            rows={3}
            placeholder="Contoh: perayaan ulang tahun, butuh kursi bayi, alergi kacang."
            className={areaClass}
            {...register("catatan")}
          />
          <PesanError pesan={errors.catatan?.message} />
        </Bagian>
      </div>

      {/* ---------------- Ringkasan (sticky) ---------------- */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)] sm:p-7">
          <h2 className={`${fontJudul} text-xl font-bold text-neutral-900`}>Ringkasan</h2>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Meja</dt>
              <dd className="font-medium text-neutral-900">
                {mejaTerpilih ? `${mejaTerpilih.nomorMeja} (${mejaTerpilih.lokasiArea})` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Waktu</dt>
              <dd className="font-medium text-neutral-900">
                {jamMulai && jamSelesai ? `${jamMulai}–${jamSelesai}` : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Tamu</dt>
              <dd className="font-medium text-neutral-900">
                {Number.isFinite(jumlahTamu) ? `${jumlahTamu} orang` : "—"}
              </dd>
            </div>
          </dl>

          <div className="my-5 border-t border-amber-100" />

          {fields.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Belum ada menu dipilih. Anda tetap bisa memesan meja saja.
            </p>
          ) : (
            <ul className="space-y-4">
              {fields.map((field, index) => {
                const item = pesanan[index];
                const info = peta.get(field.menuId);
                if (!item || !info) return null;
                return (
                  <li key={field.id}>
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-neutral-800">
                        {item.jumlah}× {info.namaMenu}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-neutral-900">
                        {rupiah.format(info.harga * (item.jumlah || 0))}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="Catatan khusus (mis. tidak pedas)"
                      aria-label={`Catatan khusus untuk ${info.namaMenu}`}
                      className={`${inputClass} mt-2 !px-4 !py-1.5 text-xs`}
                      {...register(`pesanan.${index}.catatanKhusus`)}
                    />
                    <PesanError pesan={errors.pesanan?.[index]?.catatanKhusus?.message} />
                    <PesanError pesan={errors.pesanan?.[index]?.jumlah?.message} />
                    <PesanError pesan={errors.pesanan?.[index]?.menuId?.message} />
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-5 flex items-baseline justify-between border-t border-amber-100 pt-4">
            <span className="text-sm text-neutral-500">
              Estimasi total{totalItem > 0 ? ` (${totalItem} item)` : ""}
            </span>
            <span className={`${fontJudul} text-2xl font-extrabold tabular-nums text-neutral-900`} aria-live="polite">
              {rupiah.format(totalBayar)}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Total final dihitung ulang oleh server berdasarkan harga terbaru.
          </p>

          {hasilServer && (
            <div
              role="status"
              className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
                hasilServer.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {hasilServer.message ??
                (hasilServer.success
                  ? "Reservasi terkirim. Kami akan mengonfirmasi segera."
                  : "Reservasi gagal dikirim.")}
              {hasilServer.success && (
                <Link href="/dashboard" className="mt-1 block font-semibold underline">
                  Lihat reservasi saya
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 w-full rounded-full bg-amber-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim reservasi…" : "Kirim reservasi"}
          </button>
        </div>
      </aside>
    </form>
  );
}
