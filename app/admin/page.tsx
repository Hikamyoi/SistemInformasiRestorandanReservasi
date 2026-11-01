"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Baloo_2, Poppins } from "next/font/google";
import {
  UtensilsCrossed,
  LayoutGrid,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

const baloo = Baloo_2({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-baloo" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-poppins" });

/* ----------------------------- Gaya bersama ------------------------------ */

const fontJudul = "font-[family-name:var(--font-baloo)]";
const kartu = "rounded-3xl bg-white shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)]";
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
  lokasiArea: string;
}

const pesanError = (err: unknown) => (err instanceof Error ? err.message : "Terjadi kesalahan");

// Data contoh untuk tab Rekap Transaksi (belum terhubung ke database)
const CONTOH_TRANSAKSI = [
  { kode: "RSV-2026-001", tamu: "Andi Wijaya", meja: "VIP-01", tanggal: "28 Okt 2026", jam: "19:00", total: 345000, status: "DIKONFIRMASI" },
  { kode: "RSV-2026-002", tamu: "Maya Sari", meja: "M-02", tanggal: "28 Okt 2026", jam: "20:00", total: 140000, status: "MENUNGGU_KONFIRMASI" },
  { kode: "RSV-2026-003", tamu: "Bambang Kusuma", meja: "M-01", tanggal: "29 Okt 2026", jam: "12:30", total: 95000, status: "SELESAI" },
];

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
        aktif ? "bg-amber-100 text-amber-800" : "text-neutral-600 hover:bg-amber-50 hover:text-neutral-900"
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
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
        <p className={`${fontJudul} mt-1 text-4xl font-extrabold`}>{nilai}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          {catatan}
        </p>
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">{ikon}</div>
    </div>
  );
}

function Lencana({ kelas, children }: { kelas: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${kelas}`}>
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
      <div role="dialog" aria-modal="true" aria-label={judul} className={`relative w-full ${lebar} ${kartu} p-6 sm:p-7`}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block pl-1 text-xs font-semibold text-neutral-700">{label}</label>
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

const thead = "border-b border-amber-100 bg-amber-50/70 text-[10px] uppercase tracking-wider text-neutral-500";
const barisKosong = "px-5 py-12 text-center text-neutral-500";
const tombolIkon = "cursor-pointer rounded-full p-2 transition-colors";

/* ------------------------------ Halaman ---------------------------------- */

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "meja" | "transaksi">("menu");

  // Data State
  const [menus, setMenus] = useState<Menu[]>([]);
  const [mejas, setMejas] = useState<Meja[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    lokasiArea: "Indoor",
  });

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Data Menu & Meja dari Backend API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMenu, resMeja] = await Promise.all([fetch("/api/admin/menu"), fetch("/api/admin/meja")]);

      if (resMenu.ok) {
        const json = await resMenu.json();
        const menuList = json.data || [];
        setMenus(menuList);

        // Ekstrak Kategori dari data menu yang ada
        const catsMap = new Map<string, string>();
        menuList.forEach((m: Menu) => {
          if (m.kategori?.id && m.kategori?.namaKategori) {
            catsMap.set(m.kategori.id, m.kategori.namaKategori);
          }
        });
        const extractedCats = Array.from(catsMap.entries()).map(([id, namaKategori]) => ({ id, namaKategori }));
        setCategories(extractedCats);
      }

      if (resMeja.ok) {
        const json = await resMeja.json();
        setMejas(json.data || []);
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

      showToast(editingMenu ? "Menu berhasil diupdate!" : "Menu berhasil ditambahkan!");
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
      lokasiArea: "Indoor",
    });
    setIsMejaModalOpen(true);
  };

  const handleOpenEditMeja = (meja: Meja) => {
    setEditingMeja(meja);
    setMejaForm({
      nomorMeja: meja.nomorMeja,
      kapasitas: String(meja.kapasitas),
      status: meja.status,
      lokasiArea: meja.lokasiArea,
    });
    setIsMejaModalOpen(true);
  };

  const handleSubmitMeja = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...mejaForm,
        kapasitas: Number(mejaForm.kapasitas),
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
      if (!res.ok) throw new Error(json.message || "Gagal menyimpan data meja");

      showToast(editingMeja ? "Meja berhasil diupdate!" : "Meja berhasil ditambahkan!");
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
      m.kategori?.namaKategori.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredMejas = mejas.filter(
    (m) =>
      m.nomorMeja.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lokasiArea.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
            toast.type === "success" ? "bg-green-50 text-green-800 ring-green-200" : "bg-red-50 text-red-700 ring-red-200"
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
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400 text-lg">
              🍴
            </span>
            <div>
              <h1 className={`${fontJudul} text-lg font-bold leading-tight`}>RestoReserve</h1>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        <nav aria-label="Menu admin" className="flex-1 space-y-1.5 p-4">
          <NavButton aktif={activeTab === "menu"} onClick={() => setActiveTab("menu")} ikon={<UtensilsCrossed className="h-4 w-4" />}>
            Kelola Menu
          </NavButton>
          <NavButton aktif={activeTab === "meja"} onClick={() => setActiveTab("meja")} ikon={<LayoutGrid className="h-4 w-4" />}>
            Kelola Meja
          </NavButton>
          <NavButton aktif={activeTab === "transaksi"} onClick={() => setActiveTab("transaksi")} ikon={<Receipt className="h-4 w-4" />}>
            Rekap Transaksi
          </NavButton>
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
              <h2 className={`${fontJudul} text-3xl font-extrabold tracking-tight`}>
                {activeTab === "menu" && "Katalog & Manajemen Menu"}
                {activeTab === "meja" && "Manajemen Tata Letak Meja"}
                {activeTab === "transaksi" && "Laporan & Rekap Reservasi"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Panel Kontrol Operasional Restoran - Terhubung ke Prisma & PostgreSQL
              </p>
            </div>

            <button onClick={fetchData} disabled={loading} className={`${tombolGaris} self-start !py-2 text-xs`}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-amber-600" : ""}`} />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* 4. RINGKASAN KARTU STATISTIK */}
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
              nilai={12}
              catatan="Bulan Ini (Oktober 2026)"
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
                <button onClick={handleOpenAddMenu} className={`${tombolOranye} w-full sm:w-auto`}>
                  <Plus className="h-4 w-4" />
                  <span>Tambah Menu Baru</span>
                </button>
              }
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className={thead}>
                  <tr>
                    <th className={`${sel} font-bold`}>Foto & Menu</th>
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
                      <tr key={menu.id} className="transition-colors hover:bg-amber-50/50">
                        <td className={sel}>
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={menu.fotoUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150"}
                              alt={menu.namaMenu}
                              className="h-12 w-12 shrink-0 rounded-full border-2 border-amber-100 bg-amber-50 object-cover"
                            />
                            <div>
                              <p className="text-sm font-semibold">{menu.namaMenu}</p>
                              {menu.deskripsi && (
                                <p className="line-clamp-1 max-w-xs text-[11px] text-neutral-500">{menu.deskripsi}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={sel}>
                          <Lencana kelas={WARNA_NETRAL}>{menu.kategori?.namaKategori || "Umum"}</Lencana>
                        </td>
                        <td className={`${sel} text-sm font-semibold text-amber-700`}>
                          Rp {Number(menu.harga).toLocaleString("id-ID")}
                        </td>
                        <td className={sel}>
                          <Lencana kelas={menu.statusKetersediaan ? WARNA_HIJAU : WARNA_MERAH}>
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
                              onClick={() => handleDeleteMenu(menu.id, menu.namaMenu)}
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
                <button onClick={handleOpenAddMeja} className={`${tombolOranye} w-full sm:w-auto`}>
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
                    <th className={`${sel} font-bold`}>Lokasi Area</th>
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
                      <tr key={meja.id} className="transition-colors hover:bg-amber-50/50">
                        <td className={`${sel} ${fontJudul} text-base font-bold`}>{meja.nomorMeja}</td>
                        <td className={`${sel} text-neutral-600`}>
                          <span className="font-semibold text-neutral-900">{meja.kapasitas}</span> Orang
                        </td>
                        <td className={`${sel} text-neutral-600`}>{meja.lokasiArea}</td>
                        <td className={sel}>
                          <Lencana
                            kelas={
                              meja.status === "TERSEDIA" ? WARNA_HIJAU : meja.status === "DIISI" ? WARNA_AMBER : WARNA_MERAH
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
                              onClick={() => handleDeleteMeja(meja.id, meja.nomorMeja)}
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

        {/* ================= TAB REKAP TRANSAKSI ================= */}
        {activeTab === "transaksi" && (
          <div className={`${kartu} p-6`}>
            <h3 className={`${fontJudul} mb-2 text-xl font-bold`}>Riwayat & Status Reservasi Masuk</h3>
            <p className="mb-6 text-xs text-neutral-500">
              Data transaksi pesanan meja dan pra-pesan makanan yang terhubung ke model <code>Reservasi</code> di Prisma.
            </p>

            <div className="space-y-3">
              {CONTOH_TRANSAKSI.map((item) => (
                <div
                  key={item.kode}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-100 bg-[#FFFBF2] p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700">{item.kode}</span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs font-semibold">{item.tamu}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      Meja {item.meja} | {item.tanggal} ({item.jam})
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-xs font-bold">Rp {item.total.toLocaleString("id-ID")}</span>
                    <Lencana
                      kelas={
                        item.status === "DIKONFIRMASI"
                          ? WARNA_HIJAU
                          : item.status === "SELESAI"
                            ? WARNA_NETRAL
                            : WARNA_AMBER
                      }
                    >
                      {item.status}
                    </Lencana>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL FORM MENU (TAMBAH / EDIT) ================= */}
      {isMenuModalOpen && (
        <Modal
          judul={editingMenu ? "Edit Data Menu" : "Tambah Menu Baru"}
          deskripsi={
            <>
              Validasi otomatis melalui skema Zod di <code>/api/admin/menu</code>
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
                onChange={(e) => setMenuForm({ ...menuForm, namaMenu: e.target.value })}
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
                  onChange={(e) => setMenuForm({ ...menuForm, harga: e.target.value })}
                  placeholder="50000"
                  className={inputClass}
                />
              </Field>

              <Field label="Kategori">
                <select
                  value={menuForm.kategoriId}
                  onChange={(e) => setMenuForm({ ...menuForm, kategoriId: e.target.value })}
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
                onChange={(e) => setMenuForm({ ...menuForm, fotoUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className={inputClass}
              />
            </Field>

            <Field label="Deskripsi Singkat">
              <textarea
                rows={2}
                value={menuForm.deskripsi}
                onChange={(e) => setMenuForm({ ...menuForm, deskripsi: e.target.value })}
                placeholder="Bahan rempah pilihan, potongan daging..."
                className={areaClass}
              />
            </Field>

            <div className="flex items-center gap-2 pl-1 pt-1">
              <input
                type="checkbox"
                id="statusKetersediaan"
                checked={menuForm.statusKetersediaan}
                onChange={(e) => setMenuForm({ ...menuForm, statusKetersediaan: e.target.checked })}
                className="h-4 w-4 cursor-pointer rounded accent-amber-500"
              />
              <label htmlFor="statusKetersediaan" className="cursor-pointer text-xs text-neutral-700">
                Menu Tersedia untuk Dipesan
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-amber-100 pt-4">
              <button type="button" onClick={() => setIsMenuModalOpen(false)} className={tombolGaris}>
                Batal
              </button>
              <button type="submit" disabled={actionLoading} className={tombolOranye}>
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
              Validasi otomatis melalui skema Zod di <code>/api/admin/meja</code>
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
                onChange={(e) => setMejaForm({ ...mejaForm, nomorMeja: e.target.value })}
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
                  onChange={(e) => setMejaForm({ ...mejaForm, kapasitas: e.target.value })}
                  placeholder="4"
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={mejaForm.status}
                  onChange={(e) => setMejaForm({ ...mejaForm, status: e.target.value as Meja["status"] })}
                  className={inputClass}
                >
                  <option value="TERSEDIA">TERSEDIA</option>
                  <option value="DIISI">DIISI</option>
                  <option value="DIBLOKIR">DIBLOKIR</option>
                </select>
              </Field>
            </div>

            <Field label="Lokasi Area">
              <input
                type="text"
                required
                value={mejaForm.lokasiArea}
                onChange={(e) => setMejaForm({ ...mejaForm, lokasiArea: e.target.value })}
                placeholder="Indoor, Outdoor, Rooftop, VIP Room"
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-amber-100 pt-4">
              <button type="button" onClick={() => setIsMejaModalOpen(false)} className={tombolGaris}>
                Batal
              </button>
              <button type="submit" disabled={actionLoading} className={tombolOranye}>
                {actionLoading ? "Menyimpan..." : "Simpan Meja"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
