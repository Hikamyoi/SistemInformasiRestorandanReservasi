"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Baloo_2, Poppins } from "next/font/google";
import Link from "next/link";
import {
  UtensilsCrossed,
  LayoutGrid,
  Receipt,
  FileSpreadsheet,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Crown,
} from "lucide-react";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

/* ----------------------------- Gaya bersama ------------------------------ */

const fontJudul = "font-[family-name:var(--font-baloo)]";
const kartu =
  "rounded-3xl bg-white shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)]";
const inputClass =
  "w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-900 " +
  "placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20";
const areaClass = inputClass.replace("rounded-full", "rounded-2xl");
const tombolOranye =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white " +
  "shadow-[0_8px_16px_-8px_rgba(245,158,11,0.7)] transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60";
const tombolGaris =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium " +
  "text-neutral-700 transition-colors hover:border-amber-500 hover:text-amber-600 disabled:opacity-60";
const sel = "px-5 py-3.5";

/* -------------------------------- Tipe ----------------------------------- */

interface Kategori {
  id: string;
  namaKategori: string;
}

interface Menu {
  id: string;
  namaMenu: string;
  harga: number | string;
  fotoUrl?: string | null;
  deskripsi?: string | null;
  statusKetersediaan: boolean;
  kategoriId: string;
  kategori?: Kategori;
}

interface Meja {
  id: string;
  nomorMeja: string;
  kapasitas: number;
  status: "TERSEDIA" | "DIISI" | "DIBLOKIR";
  ruangan?:
    | "INDOOR_NON_SMOKING"
    | "OUTDOOR_SMOKING"
    | "VIP_NON_SMOKING"
    | string;
  viewMeja?: string | null;
  lokasiArea: string;
}

const DEFAULT_LOKASI_BY_RUANGAN: Record<string, string> = {
  INDOOR_NON_SMOKING: "Indoor Hall Utama",
  OUTDOOR_SMOKING: "Outdoor Garden Breeze",
  VIP_NON_SMOKING: "Private VIP Room",
};

const LABEL_RUANGAN: Record<string, string> = {
  INDOOR_NON_SMOKING: "Indoor (Non-Smoking)",
  OUTDOOR_SMOKING: "Outdoor (Smoking)",
  VIP_NON_SMOKING: "Private VIP (Non-Smoking)",
};

interface ReservasiItem {
  id: string;
  kodeBooking?: string;
  namaPemesan?: string;
  noHp?: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  jumlahTamu: number;
  statusReservasi: string;
  statusPembayaran: string;
  totalBayar: number;
  catatan?: string | null;
  user?: {
    nama: string;
    email?: string;
    noHp?: string | null;
  } | null;
  meja?: {
    nomorMeja: string;
    lokasiArea?: string | null;
    ruangan?: string | null;
  } | null;
}

const pesanError = (err: unknown) =>
  err instanceof Error ? err.message : "Terjadi kesalahan";

const formatJamTampil = (val?: string | null) => {
  if (!val) return "-";
  return val.includes("T") ? val.slice(11, 16) : val.slice(0, 5);
};

/* --------------------------- Komponen kecil ------------------------------ */

function NavButton({
  aktif,
  onClick,
  ikon,
  children,
}: {
  aktif: boolean;
  onClick: () => void;
  ikon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={aktif ? "page" : undefined}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
        aktif
          ? "bg-amber-100 text-amber-800"
          : "text-neutral-600 hover:bg-amber-50 hover:text-neutral-900"
      }`}
    >
      <span className="text-amber-600">{ikon}</span>
      <span>{children}</span>
    </button>
  );
}

function KartuStat({
  label,
  nilai,
  catatan,
  ikon,
}: {
  label: string;
  nilai: React.ReactNode;
  catatan: string;
  ikon: React.ReactNode;
}) {
  return (
    <div className={`${kartu} flex items-center justify-between p-5`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className={`${fontJudul} mt-1 text-4xl font-extrabold`}>{nilai}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {catatan}
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        {ikon}
      </div>
    </div>
  );
}

function Lencana({
  kelas,
  children,
}: {
  kelas: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${kelas}`}
    >
      {children}
    </span>
  );
}

const WARNA_HIJAU = "bg-green-50 text-green-700";
const WARNA_MERAH = "bg-red-50 text-red-700";
const WARNA_AMBER = "bg-amber-100 text-amber-800";
const WARNA_NETRAL = "bg-neutral-100 text-neutral-600";

function Modal({
  judul,
  deskripsi,
  lebar,
  onTutup,
  children,
}: {
  judul: string;
  deskripsi: React.ReactNode;
  lebar: string;
  onTutup: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`relative w-full ${lebar} ${kartu} p-6 sm:p-7`}
      >
        <button
          onClick={onTutup}
          aria-label="Tutup"
          className="absolute right-4 top-4 cursor-pointer text-neutral-400 hover:text-neutral-900"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className={`${fontJudul} text-xl font-bold`}>{judul}</h3>
        <p className="mb-5 mt-1 text-xs text-neutral-500">{deskripsi}</p>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block pl-1 text-xs font-semibold text-neutral-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toolbar({
  placeholder,
  value,
  onChange,
  tombol,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  tombol: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 border-b border-amber-100 p-4 sm:flex-row sm:p-5">
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder={placeholder}
          aria-label={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} !pl-10`}
        />
      </div>
      {tombol}
    </div>
  );
}

const thead =
  "border-b border-amber-100 bg-amber-50/70 text-[10px] uppercase tracking-wider text-neutral-500";
const barisKosong = "px-5 py-12 text-center text-neutral-500";
const tombolIkon = "cursor-pointer rounded-full p-2 transition-colors";

/* ------------------------------ Halaman ---------------------------------- */

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "meja" | "transaksi">(
    "menu",
  );

  // Data State
  const [menus, setMenus] = useState<Menu[]>([]);
  const [mejas, setMejas] = useState<Meja[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [reservasis, setReservasis] = useState<ReservasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State Menu
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState({
    namaMenu: "",
    harga: "",
    kategoriId: "",
    fotoUrl: "",
    deskripsi: "",
    statusKetersediaan: true,
  });

  // Modal State Meja
  const [isMejaModalOpen, setIsMejaModalOpen] = useState(false);
  const [editingMeja, setEditingMeja] = useState<Meja | null>(null);
  const [mejaForm, setMejaForm] = useState({
    nomorMeja: "",
    kapasitas: "4",
    status: "TERSEDIA" as "TERSEDIA" | "DIISI" | "DIBLOKIR",
    ruangan: "INDOOR_NON_SMOKING" as
      | "INDOOR_NON_SMOKING"
      | "OUTDOOR_SMOKING"
      | "VIP_NON_SMOKING",
    lokasiArea: "Indoor Hall Utama",
    viewMeja: "",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Data Menu, Meja, dan Reservasi dari Database
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMenu, resMeja, resReservasi] = await Promise.all([
        fetch("/api/admin/menu"),
        fetch("/api/admin/meja"),
        fetch("/api/admin/reservasi"),
      ]);

      if (resMenu.ok) {
        const json = await resMenu.json();
        const menuList = json.data || [];
        setMenus(menuList);

        const catsMap = new Map<string, string>();
        menuList.forEach((m: Menu) => {
          if (m.kategori?.id && m.kategori?.namaKategori) {
            catsMap.set(m.kategori.id, m.kategori.namaKategori);
          }
        });
        const extractedCats = Array.from(catsMap.entries()).map(
          ([id, namaKategori]) => ({ id, namaKategori }),
        );
        setCategories(extractedCats);
      }

      if (resMeja.ok) {
        const json = await resMeja.json();
        setMejas(json.data || []);
      }

      if (resReservasi.ok) {
        const json = await resReservasi.json();
        const list = Array.isArray(json)
          ? json
          : json.data || json.reservasi || [];
        setReservasis(list);
      } else {
        const errJson = await resReservasi.json().catch(() => ({}));
        showToast(
          errJson.error ||
            `Gagal memuat data reservasi (HTTP ${resReservasi.status})`,
          "error",
        );
      }
    } catch (err) {
      console.error(err);
      showToast("Gagal memuat data dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  // ==================== HANDLER MENU ====================
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      namaMenu: "",
      harga: "",
      kategoriId: categories[0]?.id || "",
      fotoUrl: "",
      deskripsi: "",
      statusKetersediaan: true,
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (menu: Menu) => {
    setEditingMenu(menu);
    setMenuForm({
      namaMenu: menu.namaMenu,
      harga: String(menu.harga),
      kategoriId: menu.kategoriId,
      fotoUrl: menu.fotoUrl || "",
      deskripsi: menu.deskripsi || "",
      statusKetersediaan: menu.statusKetersediaan,
    });
    setIsMenuModalOpen(true);
  };

  const handleSubmitMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...menuForm,
        harga: Number(menuForm.harga),
      };

      const url = "/api/admin/menu";
      const method = editingMenu ? "PUT" : "POST";
      const body = editingMenu ? { id: editingMenu.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan menu");

      showToast(
        editingMenu ? "Menu berhasil diupdate!" : "Menu berhasil ditambahkan!",
      );
      setIsMenuModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(pesanError(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenu = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin menghapus menu "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus menu");
      showToast("Menu berhasil dihapus!");
      fetchData();
    } catch (err) {
      showToast(pesanError(err), "error");
    }
  };

  // ==================== HANDLER MEJA ====================
  const handleOpenAddMeja = () => {
    setEditingMeja(null);
    setMejaForm({
      nomorMeja: "",
      kapasitas: "4",
      status: "TERSEDIA",
      ruangan: "INDOOR_NON_SMOKING",
      lokasiArea: "Indoor Hall Utama",
      viewMeja: "",
    });
    setIsMejaModalOpen(true);
  };

  const handleOpenEditMeja = (meja: Meja) => {
    setEditingMeja(meja);
    const ruanganAwal =
      meja.ruangan === "OUTDOOR_SMOKING" ||
      meja.ruangan === "VIP_NON_SMOKING" ||
      meja.ruangan === "INDOOR_NON_SMOKING"
        ? meja.ruangan
        : "INDOOR_NON_SMOKING";
    setMejaForm({
      nomorMeja: meja.nomorMeja,
      kapasitas: String(meja.kapasitas),
      status: meja.status,
      ruangan: ruanganAwal,
      lokasiArea: meja.lokasiArea || DEFAULT_LOKASI_BY_RUANGAN[ruanganAwal],
      viewMeja: meja.viewMeja || "",
    });
    setIsMejaModalOpen(true);
  };

  const handleUbahRuanganMeja = (
    ruanganBaru: "INDOOR_NON_SMOKING" | "OUTDOOR_SMOKING" | "VIP_NON_SMOKING",
  ) => {
    const nilaiDefaultLama = Object.values(DEFAULT_LOKASI_BY_RUANGAN).concat([
      "Indoor",
      "Outdoor",
      "",
    ]);
    const perluAutoLokasi = nilaiDefaultLama.includes(
      mejaForm.lokasiArea.trim(),
    );

    setMejaForm({
      ...mejaForm,
      ruangan: ruanganBaru,
      lokasiArea: perluAutoLokasi
        ? DEFAULT_LOKASI_BY_RUANGAN[ruanganBaru]
        : mejaForm.lokasiArea,
      viewMeja:
        ruanganBaru === "VIP_NON_SMOKING" && !mejaForm.viewMeja.trim()
          ? "Private VIP Room (Eksklusif)"
          : mejaForm.viewMeja,
    });
  };

  const handleSubmitMeja = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...mejaForm,
        kapasitas: Number(mejaForm.kapasitas),
        viewMeja: mejaForm.viewMeja.trim() || null,
      };

      const url = "/api/admin/meja";
      const method = editingMeja ? "PUT" : "POST";
      const body = editingMeja ? { id: editingMeja.id, ...payload } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.message || json.error || "Gagal menyimpan data meja",
        );
      }

      showToast(
        editingMeja ? "Meja berhasil diupdate!" : "Meja berhasil ditambahkan!",
      );
      setIsMejaModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(pesanError(err), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMeja = async (id: string, nomor: string) => {
    if (!confirm(`Yakin ingin menghapus Meja "${nomor}"?`)) return;
    try {
      const res = await fetch(`/api/admin/meja?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus meja");
      showToast("Meja berhasil dihapus!");
      fetchData();
    } catch (err) {
      showToast(pesanError(err), "error");
    }
  };

  // Filter Data Berdasarkan Pencarian
  const filteredMenus = menus.filter(
    (m) =>
      m.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.kategori?.namaKategori || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const filteredMejas = mejas.filter(
    (m) =>
      m.nomorMeja.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.lokasiArea || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (LABEL_RUANGAN[m.ruangan || ""] || m.ruangan || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredReservasi = reservasis.filter((r) => {
    if (!q) return true;
    const namaTamu = (r.namaPemesan || r.user?.nama || "").toLowerCase();
    const kode = (r.kodeBooking || "").toLowerCase();
    const hp = (r.noHp || r.user?.noHp || "").toLowerCase();
    const nomorMeja = (r.meja?.nomorMeja || "").toLowerCase();
    return (
      namaTamu.includes(q) ||
      kode.includes(q) ||
      hp.includes(q) ||
      nomorMeja.includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className={`${baloo.variable} ${poppins.variable} flex min-h-screen flex-col bg-[#FFFBF2] text-neutral-900 md:flex-row`}
      style={{ fontFamily: "var(--font-poppins), system-ui, sans-serif" }}
    >
      {/* Notifikasi Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed right-5 top-5 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-xl ring-1 ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 ring-green-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ================= 1. SIDEBAR NAVIGASI ================= */}
      <aside className="flex w-full shrink-0 flex-col border-b border-amber-100 bg-white md:w-64 md:border-b-0 md:border-r">
        <div className="border-b border-amber-100 p-6">
          <Link
            href="/"
            title="Klik untuk melihat Website"
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            {/* Ikon Vektor 11 Garpu & Pisau Asli Elevenicious */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 p-2 shadow-sm">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <g fill="#FFFFFF">
                  <path d="M35 18V38C35 41.5 37.5 44 41 45V80H45V45C48.5 44 51 41.5 51 38V18H48V34H46V18H44V34H42V18H39V34H37V18H35Z" />
                  <path d="M36 40L26 47V53L36 46V40Z" />
                </g>
                <g fill="#FFFFFF">
                  <path d="M57 18H62V42L68 56C68 68 63 80 57 80V18Z" />
                  <path d="M57 40L48 47V53L57 46V40Z" />
                </g>
              </svg>
            </div>
            <div>
              <h1
                className={`${fontJudul} text-lg font-extrabold leading-tight tracking-tight text-neutral-900`}
              >
                Eleven<span className="text-amber-500">icious</span>
              </h1>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="Menu admin" className="flex-1 space-y-1.5 p-4">
          <NavButton
            aktif={activeTab === "menu"}
            onClick={() => setActiveTab("menu")}
            ikon={<UtensilsCrossed className="h-4 w-4" />}
          >
            Kelola Menu
          </NavButton>
          <NavButton
            aktif={activeTab === "meja"}
            onClick={() => setActiveTab("meja")}
            ikon={<LayoutGrid className="h-4 w-4" />}
          >
            Kelola Meja
          </NavButton>
          <NavButton
            aktif={activeTab === "transaksi"}
            onClick={() => setActiveTab("transaksi")}
            ikon={<Receipt className="h-4 w-4" />}
          >
            Rekap Transaksi
          </NavButton>
          <Link
            href="/admin/laporan"
            className="flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-sm font-semibold text-neutral-600 transition-colors hover:bg-amber-50 hover:text-neutral-900"
          >
            <span className="text-emerald-600">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <span>Laporan POS &amp; Excel</span>
          </Link>
        </nav>

        {/* Profil Admin & Tombol Logout */}
        <div className="border-t border-amber-100 p-4">
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
              A
            </div>
            <div>
              <p className="text-xs font-semibold">Admin Resto</p>
              <p className="text-[10px] text-neutral-500">admin@resto.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* TOP BAR / STATS */}
        <div className="mb-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2
                className={`${fontJudul} text-3xl font-extrabold tracking-tight`}
              >
                {activeTab === "menu" && "Katalog & Manajemen Menu"}
                {activeTab === "meja" && "Manajemen Tata Letak Meja"}
                {activeTab === "transaksi" && "Laporan & Rekap Reservasi"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Panel Kontrol Operasional Restoran - Terhubung ke Prisma &
                PostgreSQL
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className={`${tombolGaris} self-start !py-2 text-xs`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-600" : ""}`}
              />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* RINGKASAN KARTU STATISTIK (SECARA DINAMIS) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KartuStat
              label="Total Menu"
              nilai={menus.length}
              catatan={`${menus.filter((m) => m.statusKetersediaan).length} Menu Tersedia`}
              ikon={<UtensilsCrossed className="h-6 w-6" />}
            />
            <KartuStat
              label="Total Meja"
              nilai={mejas.length}
              catatan={`Total Kapasitas: ${mejas.reduce((acc, m) => acc + m.kapasitas, 0)} Kursi`}
              ikon={<LayoutGrid className="h-6 w-6" />}
            />
            <KartuStat
              label="Total Reservasi"
              nilai={reservasis.length}
              catatan={`${reservasis.filter((r) => r.statusReservasi === "DIKONFIRMASI").length} Dikonfirmasi`}
              ikon={<Receipt className="h-6 w-6" />}
            />
          </div>
        </div>

        {/* ================= 2. TAB KELOLA MENU ================= */}
        {activeTab === "menu" && (
          <div className={`${kartu} overflow-hidden`}>
            <Toolbar
              placeholder="Cari nama menu / kategori..."
              value={searchQuery}
              onChange={setSearchQuery}
              tombol={
                <button
                  onClick={handleOpenAddMenu}
                  className={`${tombolOranye} w-full sm:w-auto`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Menu Baru</span>
                </button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={thead}>
                  <tr>
                    <th className={`${sel} font-bold`}>Foto &amp; Menu</th>
                    <th className={`${sel} font-bold`}>Kategori</th>
                    <th className={`${sel} font-bold`}>Harga</th>
                    <th className={`${sel} font-bold`}>Status</th>
                    <th className={`${sel} text-right font-bold`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className={barisKosong}>
                        <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                        Memuat data menu...
                      </td>
                    </tr>
                  ) : filteredMenus.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={barisKosong}>
                        Tidak ada menu ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((menu) => (
                      <tr
                        key={menu.id}
                        className="transition-colors hover:bg-amber-50/50"
                      >
                        <td className={sel}>
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={
                                menu.fotoUrl ||
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150"
                              }
                              alt={menu.namaMenu}
                              className="h-12 w-12 shrink-0 rounded-full border-2 border-amber-100 bg-amber-50 object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold">
                                {menu.namaMenu}
                              </p>
                              {menu.deskripsi && (
                                <p className="line-clamp-1 max-w-xs text-[11px] text-neutral-500">
                                  {menu.deskripsi}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={sel}>
                          <Lencana kelas={WARNA_NETRAL}>
                            {menu.kategori?.namaKategori || "Umum"}
                          </Lencana>
                        </td>
                        <td
                          className={`${sel} text-sm font-semibold text-amber-700`}
                        >
                          Rp {Number(menu.harga).toLocaleString("id-ID")}
                        </td>
                        <td className={sel}>
                          <Lencana
                            kelas={
                              menu.statusKetersediaan
                                ? WARNA_HIJAU
                                : WARNA_MERAH
                            }
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${menu.statusKetersediaan ? "bg-green-500" : "bg-red-500"}`}
                            />
                            {menu.statusKetersediaan ? "Tersedia" : "Habis"}
                          </Lencana>
                        </td>
                        <td className={`${sel} text-right`}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMenu(menu)}
                              className={`${tombolIkon} bg-neutral-100 text-neutral-600 hover:bg-amber-100 hover:text-amber-700`}
                              title="Edit Menu"
                              aria-label={`Edit ${menu.namaMenu}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMenu(menu.id, menu.namaMenu)
                              }
                              className={`${tombolIkon} bg-red-50 text-red-600 hover:bg-red-100`}
                              title="Hapus Menu"
                              aria-label={`Hapus ${menu.namaMenu}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= 3. TAB KELOLA MEJA ================= */}
        {activeTab === "meja" && (
          <div className={`${kartu} overflow-hidden`}>
            <Toolbar
              placeholder="Cari nomor meja / area..."
              value={searchQuery}
              onChange={setSearchQuery}
              tombol={
                <button
                  onClick={handleOpenAddMeja}
                  className={`${tombolOranye} w-full sm:w-auto`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Meja Baru</span>
                </button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={thead}>
                  <tr>
                    <th className={`${sel} font-bold`}>Nomor Meja</th>
                    <th className={`${sel} font-bold`}>Kapasitas</th>
                    <th className={`${sel} font-bold`}>
                      Zona Ruangan &amp; Area
                    </th>
                    <th className={`${sel} font-bold`}>Status Meja</th>
                    <th className={`${sel} text-right font-bold`}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className={barisKosong}>
                        <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                        Memuat data meja...
                      </td>
                    </tr>
                  ) : filteredMejas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={barisKosong}>
                        Tidak ada data meja.
                      </td>
                    </tr>
                  ) : (
                    filteredMejas.map((meja) => (
                      <tr
                        key={meja.id}
                        className="transition-colors hover:bg-amber-50/50"
                      >
                        <td
                          className={`${sel} ${fontJudul} text-base font-bold`}
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span>{meja.nomorMeja}</span>
                            {meja.ruangan === "VIP_NON_SMOKING" && (
                              <Crown
                                className="h-4 w-4 text-amber-500"
                                aria-label="VIP"
                              />
                            )}
                          </span>
                        </td>
                        <td className={`${sel} text-neutral-600`}>
                          <span className="font-semibold text-neutral-900">
                            {meja.kapasitas}
                          </span>{" "}
                          Orang
                        </td>
                        <td className={`${sel} text-neutral-600`}>
                          <div className="flex flex-col gap-1">
                            <Lencana
                              kelas={
                                meja.ruangan === "VIP_NON_SMOKING"
                                  ? WARNA_AMBER
                                  : meja.ruangan === "OUTDOOR_SMOKING"
                                    ? WARNA_HIJAU
                                    : WARNA_NETRAL
                              }
                            >
                              {LABEL_RUANGAN[
                                meja.ruangan || "INDOOR_NON_SMOKING"
                              ] ||
                                meja.ruangan ||
                                "Indoor (Non-Smoking)"}
                            </Lencana>
                            <span className="text-[11px] text-neutral-500">
                              {meja.viewMeja || meja.lokasiArea}
                            </span>
                          </div>
                        </td>
                        <td className={sel}>
                          <Lencana
                            kelas={
                              meja.status === "TERSEDIA"
                                ? WARNA_HIJAU
                                : meja.status === "DIISI"
                                  ? WARNA_AMBER
                                  : WARNA_MERAH
                            }
                          >
                            {meja.status}
                          </Lencana>
                        </td>
                        <td className={`${sel} text-right`}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMeja(meja)}
                              className={`${tombolIkon} bg-neutral-100 text-neutral-600 hover:bg-amber-100 hover:text-amber-700`}
                              title="Edit Meja"
                              aria-label={`Edit meja ${meja.nomorMeja}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMeja(meja.id, meja.nomorMeja)
                              }
                              className={`${tombolIkon} bg-red-50 text-red-600 hover:bg-red-100`}
                              title="Hapus Meja"
                              aria-label={`Hapus meja ${meja.nomorMeja}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB REKAP TRANSAKSI (DATA ASLI DARI DATABASE) ================= */}
        {activeTab === "transaksi" && (
          <div className={`${kartu} p-6`}>
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className={`${fontJudul} text-xl font-bold`}>
                  Riwayat &amp; Status Reservasi Masuk
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Data transaksi pesanan meja dan pra-pesan makanan yang
                  terhubung langsung ke tabel database Prisma.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari tamu / kode / meja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <Link
                  href="/admin/laporan"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Laporan POS &amp; Excel</span>
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-amber-500" />
                Memuat data riwayat reservasi...
              </div>
            ) : filteredReservasi.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-[#FFFBF2] py-12 text-center text-xs text-neutral-500">
                Belum ada data reservasi yang sesuai.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReservasi.map((item) => {
                  const namaPemesan =
                    item.namaPemesan || item.user?.nama || "Pelanggan Anonim";
                  const noHp = item.noHp || item.user?.noHp;
                  const kodeTampil =
                    item.kodeBooking || item.id.slice(0, 8).toUpperCase();

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-100 bg-[#FFFBF2] p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-center"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/reservasi/${kodeTampil}`}
                            className="font-mono text-xs font-bold text-amber-700 hover:underline"
                          >
                            {kodeTampil}
                          </Link>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs font-semibold text-neutral-900">
                            {namaPemesan}
                          </span>
                          {noHp && (
                            <span className="text-[11px] text-neutral-500">
                              ({noHp})
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] text-neutral-500">
                          Meja {item.meja?.nomorMeja || "-"} (
                          {item.meja?.lokasiArea || item.meja?.ruangan || "-"})
                          {" | "}
                          {new Date(item.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          ({formatJamTampil(item.jamMulai)} -{" "}
                          {formatJamTampil(item.jamSelesai)} WIB) •{" "}
                          {item.jumlahTamu} Tamu
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs font-bold text-neutral-900">
                          Rp {Number(item.totalBayar).toLocaleString("id-ID")}
                        </span>
                        <Lencana
                          kelas={
                            item.statusReservasi === "DIKONFIRMASI"
                              ? WARNA_HIJAU
                              : item.statusReservasi === "SELESAI"
                                ? WARNA_NETRAL
                                : item.statusReservasi === "DIBATALKAN"
                                  ? WARNA_MERAH
                                  : WARNA_AMBER
                          }
                        >
                          {item.statusReservasi}
                        </Lencana>
                        <Lencana
                          kelas={
                            item.statusPembayaran === "LUNAS"
                              ? WARNA_HIJAU
                              : WARNA_NETRAL
                          }
                        >
                          {item.statusPembayaran}
                        </Lencana>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= MODAL FORM MENU (TAMBAH / EDIT) ================= */}
      {isMenuModalOpen && (
        <Modal
          judul={editingMenu ? "Edit Data Menu" : "Tambah Menu Baru"}
          deskripsi={
            <>
              Validasi otomatis melalui skema Zod di{" "}
              <code>/api/admin/menu</code>
            </>
          }
          lebar="max-w-lg"
          onTutup={() => setIsMenuModalOpen(false)}
        >
          <form onSubmit={handleSubmitMenu} className="space-y-4">
            <Field label="Nama Menu">
              <input
                type="text"
                required
                value={menuForm.namaMenu}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, namaMenu: e.target.value })
                }
                placeholder="e.g. Nasi Goreng Wagyu"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Harga (Rp)">
                <input
                  type="number"
                  required
                  min={1000}
                  value={menuForm.harga}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, harga: e.target.value })
                  }
                  placeholder="50000"
                  className={inputClass}
                />
              </Field>

              <Field label="Kategori">
                <select
                  value={menuForm.kategoriId}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, kategoriId: e.target.value })
                  }
                  className={inputClass}
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.namaKategori}
                      </option>
                    ))
                  ) : (
                    <option value="">Pilih Kategori</option>
                  )}
                </select>
              </Field>
            </div>

            <Field label="Foto Menu (URL Gambar)">
              <input
                type="url"
                value={menuForm.fotoUrl}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, fotoUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className={inputClass}
              />
            </Field>

            <Field label="Deskripsi Singkat">
              <textarea
                rows={2}
                value={menuForm.deskripsi}
                onChange={(e) =>
                  setMenuForm({ ...menuForm, deskripsi: e.target.value })
                }
                placeholder="Bahan rempah pilihan, potongan daging..."
                className={areaClass}
              />
            </Field>

            <div className="flex items-center gap-2 pl-1 pt-1">
              <input
                type="checkbox"
                id="statusKetersediaan"
                checked={menuForm.statusKetersediaan}
                onChange={(e) =>
                  setMenuForm({
                    ...menuForm,
                    statusKetersediaan: e.target.checked,
                  })
                }
                className="h-4 w-4 cursor-pointer rounded accent-amber-500"
              />
              <label
                htmlFor="statusKetersediaan"
                className="cursor-pointer text-xs text-neutral-700"
              >
                Menu Tersedia untuk Dipesan
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-amber-100 pt-4">
              <button
                type="button"
                onClick={() => setIsMenuModalOpen(false)}
                className={tombolGaris}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={tombolOranye}
              >
                {actionLoading ? "Menyimpan..." : "Simpan Menu"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= MODAL FORM MEJA (TAMBAH / EDIT) ================= */}
      {isMejaModalOpen && (
        <Modal
          judul={editingMeja ? "Edit Data Meja" : "Tambah Meja Baru"}
          deskripsi={
            <>
              Validasi otomatis melalui skema Zod di{" "}
              <code>/api/admin/meja</code>
            </>
          }
          lebar="max-w-md"
          onTutup={() => setIsMejaModalOpen(false)}
        >
          <form onSubmit={handleSubmitMeja} className="space-y-4">
            <Field label="Nomor / Kode Meja">
              <input
                type="text"
                required
                value={mejaForm.nomorMeja}
                onChange={(e) =>
                  setMejaForm({ ...mejaForm, nomorMeja: e.target.value })
                }
                placeholder="e.g. M-05 atau VIP-02"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kapasitas (Kursi)">
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={mejaForm.kapasitas}
                  onChange={(e) =>
                    setMejaForm({ ...mejaForm, kapasitas: e.target.value })
                  }
                  placeholder="4"
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={mejaForm.status}
                  onChange={(e) =>
                    setMejaForm({
                      ...mejaForm,
                      status: e.target.value as Meja["status"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="TERSEDIA">TERSEDIA</option>
                  <option value="DIISI">DIISI</option>
                  <option value="DIBLOKIR">DIBLOKIR</option>
                </select>
              </Field>
            </div>

            <Field label="Zona Ruangan">
              <select
                value={mejaForm.ruangan}
                onChange={(e) =>
                  handleUbahRuanganMeja(
                    e.target.value as
                      | "INDOOR_NON_SMOKING"
                      | "OUTDOOR_SMOKING"
                      | "VIP_NON_SMOKING",
                  )
                }
                className={inputClass}
              >
                <option value="INDOOR_NON_SMOKING">Indoor (Non-Smoking)</option>
                <option value="OUTDOOR_SMOKING">Outdoor (Smoking)</option>
                <option value="VIP_NON_SMOKING">
                  Private VIP Room (Non-Smoking)
                </option>
              </select>
            </Field>

            <Field label="Lokasi Area">
              <input
                type="text"
                required
                value={mejaForm.lokasiArea}
                onChange={(e) =>
                  setMejaForm({ ...mejaForm, lokasiArea: e.target.value })
                }
                placeholder="Indoor Hall Utama, Outdoor Garden, Private VIP Room"
                className={inputClass}
              />
            </Field>

            <Field label="Keterangan View Meja (Opsional)">
              <input
                type="text"
                value={mejaForm.viewMeja}
                onChange={(e) =>
                  setMejaForm({ ...mejaForm, viewMeja: e.target.value })
                }
                placeholder="Contoh: Private VIP Room (Eksklusif) / Dekat Jendela"
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-amber-100 pt-4">
              <button
                type="button"
                onClick={() => setIsMejaModalOpen(false)}
                className={tombolGaris}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className={tombolOranye}
              >
                {actionLoading ? "Menyimpan..." : "Simpan Meja"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
