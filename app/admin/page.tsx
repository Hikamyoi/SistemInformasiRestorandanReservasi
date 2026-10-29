"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "meja" | "transaksi">(
    "menu",
  );

  // Data State
  const [menus, setMenus] = useState<Menu[]>([]);
  const [mejas, setMejas] = useState<Meja[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
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
    lokasiArea: "Indoor",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Data Menu & Meja dari Backend API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMenu, resMeja] = await Promise.all([
        fetch("/api/admin/menu"),
        fetch("/api/admin/meja"),
      ]);

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
        const extractedCats = Array.from(catsMap.entries()).map(
          ([id, namaKategori]) => ({ id, namaKategori }),
        );
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

      showToast(
        editingMenu ? "Menu berhasil diupdate!" : "Menu berhasil ditambahkan!",
      );
      setIsMenuModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
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
    } catch (err: any) {
      showToast(err.message, "error");
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

      showToast(
        editingMeja ? "Meja berhasil diupdate!" : "Meja berhasil ditambahkan!",
      );
      setIsMejaModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
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
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  // Filter Data Berdasarkan Pencarian
  const filteredMenus = menus.filter(
    (m) =>
      m.namaMenu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.kategori?.namaKategori
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const filteredMejas = mejas.filter(
    (m) =>
      m.nomorMeja.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lokasiArea.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Notifikasi Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-2xl transition animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/90 border-rose-500/40 text-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ================= 1. SIDEBAR NAVIGASI ================= */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-950/50">
              🍽️
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">
                RestoReserve
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 uppercase">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab("menu")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "menu"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
            <span>Kelola Menu</span>
          </button>

          <button
            onClick={() => setActiveTab("meja")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "meja"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-blue-400" />
            <span>Kelola Meja</span>
          </button>

          <button
            onClick={() => setActiveTab("transaksi")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === "transaksi"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Receipt className="w-4 h-4 text-purple-400" />
            <span>Rekap Transaksi</span>
          </button>
        </nav>

        {/* Profil Admin & Tombol Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-300">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Admin Resto</p>
              <p className="text-[10px] text-slate-400">admin@resto.com</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {/* TOP BAR / STATS */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {activeTab === "menu" && "Katalog & Manajemen Menu"}
                {activeTab === "meja" && "Manajemen Tata Letak Meja"}
                {activeTab === "transaksi" && "Laporan & Rekap Reservasi"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Panel Kontrol Operasional Restoran - Terhubung ke Prisma &
                PostgreSQL
              </p>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 transition self-start cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`}
              />
              <span>Segarkan Data</span>
            </button>
          </div>

          {/* 4. RINGKASAN KARTU STATISTIK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Menu
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-1">
                    {menus.length}
                  </p>
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {menus.filter((m) => m.statusKetersediaan).length} Menu
                    Tersedia
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UtensilsCrossed className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Meja
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-1">
                    {mejas.length}
                  </p>
                  <p className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Total Kapasitas:{" "}
                    {mejas.reduce((acc, m) => acc + m.kapasitas, 0)} Kursi
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <LayoutGrid className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total Reservasi
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-1">12</p>
                  <p className="text-[11px] text-purple-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Bulan Ini (Oktober 2026)
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. TAB KELOLA MENU ================= */}
        {activeTab === "menu" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Toolbar Pencarian & Tombol Tambah */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nama menu / kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                onClick={handleOpenAddMenu}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Baru</span>
              </button>
            </div>

            {/* Tabel Menu */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Foto & Menu</th>
                    <th className="px-5 py-3.5 font-bold">Kategori</th>
                    <th className="px-5 py-3.5 font-bold">Harga</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                        Memuat data menu...
                      </td>
                    </tr>
                  ) : filteredMenus.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Tidak ada menu ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMenus.map((menu) => (
                      <tr
                        key={menu.id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                menu.fotoUrl ||
                                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150"
                              }
                              alt={menu.namaMenu}
                              className="w-11 h-11 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                            />
                            <div>
                              <p className="font-bold text-white text-sm">
                                {menu.namaMenu}
                              </p>
                              {menu.deskripsi && (
                                <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                                  {menu.deskripsi}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                            {menu.kategori?.namaKategori || "Umum"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-emerald-400">
                          Rp {Number(menu.harga).toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              menu.statusKetersediaan
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                                : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${menu.statusKetersediaan ? "bg-emerald-400" : "bg-rose-400"}`}
                            />
                            {menu.statusKetersediaan ? "Tersedia" : "Habis"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMenu(menu)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                              title="Edit Menu"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMenu(menu.id, menu.namaMenu)
                              }
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition cursor-pointer"
                              title="Hapus Menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Toolbar Meja */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari nomor meja / area..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleOpenAddMeja}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Meja Baru</span>
              </button>
            </div>

            {/* Tabel Meja */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Nomor Meja</th>
                    <th className="px-5 py-3.5 font-bold">Kapasitas</th>
                    <th className="px-5 py-3.5 font-bold">Lokasi Area</th>
                    <th className="px-5 py-3.5 font-bold">Status Meja</th>
                    <th className="px-5 py-3.5 font-bold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
                        Memuat data meja...
                      </td>
                    </tr>
                  ) : filteredMejas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        Tidak ada data meja.
                      </td>
                    </tr>
                  ) : (
                    filteredMejas.map((meja) => (
                      <tr
                        key={meja.id}
                        className="hover:bg-slate-800/40 transition"
                      >
                        <td className="px-5 py-3.5 font-bold text-white text-sm">
                          {meja.nomorMeja}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">
                          <span className="font-semibold text-white">
                            {meja.kapasitas}
                          </span>{" "}
                          Orang
                        </td>
                        <td className="px-5 py-3.5 text-slate-300">
                          {meja.lokasiArea}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              meja.status === "TERSEDIA"
                                ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                                : meja.status === "DIISI"
                                  ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                                  : "bg-rose-950/80 text-rose-300 border-rose-800/60"
                            }`}
                          >
                            {meja.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditMeja(meja)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                              title="Edit Meja"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteMeja(meja.id, meja.nomorMeja)
                              }
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 transition cursor-pointer"
                              title="Hapus Meja"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2">
              Riwayat & Status Reservasi Masuk
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Data transaksi pesanan meja dan pra-pesan makanan yang terhubung
              ke model <code>Reservasi</code> di Prisma.
            </p>

            <div className="space-y-3">
              {[
                {
                  kode: "RSV-2026-001",
                  tamu: "Andi Wijaya",
                  meja: "VIP-01",
                  tanggal: "28 Okt 2026",
                  jam: "19:00",
                  total: 345000,
                  status: "DIKONFIRMASI",
                },
                {
                  kode: "RSV-2026-002",
                  tamu: "Maya Sari",
                  meja: "M-02",
                  tanggal: "28 Okt 2026",
                  jam: "20:00",
                  total: 140000,
                  status: "MENUNGGU_KONFIRMASI",
                },
                {
                  kode: "RSV-2026-003",
                  tamu: "Bambang Kusuma",
                  meja: "M-01",
                  tanggal: "29 Okt 2026",
                  jam: "12:30",
                  total: 95000,
                  status: "SELESAI",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800 gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        {item.kode}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs font-semibold text-white">
                        {item.tamu}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Meja {item.meja} | {item.tanggal} ({item.jam})
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="text-xs font-bold text-white">
                      Rp {item.total.toLocaleString("id-ID")}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === "DIKONFIRMASI"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                          : item.status === "SELESAI"
                            ? "bg-blue-950 text-blue-400 border-blue-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL FORM MENU (TAMBAH / EDIT) ================= */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsMenuModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingMenu ? "Edit Data Menu" : "Tambah Menu Baru"}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Validasi otomatis melalui skema Zod di{" "}
              <code>/api/admin/menu</code>
            </p>

            <form onSubmit={handleSubmitMenu} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={menuForm.namaMenu}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, namaMenu: e.target.value })
                  }
                  placeholder="e.g. Nasi Goreng Wagyu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={menuForm.harga}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, harga: e.target.value })
                    }
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={menuForm.kategoriId}
                    onChange={(e) =>
                      setMenuForm({ ...menuForm, kategoriId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Foto Menu (URL Gambar)
                </label>
                <input
                  type="url"
                  value={menuForm.fotoUrl}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, fotoUrl: e.target.value })
                  }
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={menuForm.deskripsi}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, deskripsi: e.target.value })
                  }
                  placeholder="Bahan rempah pilihan, potongan daging..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
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
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="statusKetersediaan"
                  className="text-xs text-slate-300 cursor-pointer"
                >
                  Menu Tersedia untuk Dipesan
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Menu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL FORM MEJA (TAMBAH / EDIT) ================= */}
      {isMejaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsMejaModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              {editingMeja ? "Edit Data Meja" : "Tambah Meja Baru"}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Validasi otomatis melalui skema Zod di{" "}
              <code>/api/admin/meja</code>
            </p>

            <form onSubmit={handleSubmitMeja} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nomor / Kode Meja
                </label>
                <input
                  type="text"
                  required
                  value={mejaForm.nomorMeja}
                  onChange={(e) =>
                    setMejaForm({ ...mejaForm, nomorMeja: e.target.value })
                  }
                  placeholder="e.g. M-05 atau VIP-02"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kapasitas (Kursi)
                  </label>
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
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={mejaForm.status}
                    onChange={(e) =>
                      setMejaForm({
                        ...mejaForm,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="TERSEDIA">TERSEDIA</option>
                    <option value="DIISI">DIISI</option>
                    <option value="DIBLOKIR">DIBLOKIR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Lokasi Area
                </label>
                <input
                  type="text"
                  required
                  value={mejaForm.lokasiArea}
                  onChange={(e) =>
                    setMejaForm({ ...mejaForm, lokasiArea: e.target.value })
                  }
                  placeholder="Indoor, Outdoor, Rooftop, VIP Room"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMejaModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
                >
                  {actionLoading ? "Menyimpan..." : "Simpan Meja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
