"use client";

import { useEffect, useState } from "react";
import { simpanLangganan, hapusLangganan } from "@/app/dashboard/push-actions";

type Status = "memuat" | "tidak-didukung" | "ditolak" | "mati" | "aktif" | "proses";

function kunciKeUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const mentah = atob(base64);
  const hasil = new Uint8Array(mentah.length);
  for (let i = 0; i < mentah.length; i++) hasil[i] = mentah.charCodeAt(i);
  return hasil;
}

export default function PushToggle() {
  const [status, setStatus] = useState<Status>("memuat");
  const [pesan, setPesan] = useState<string | null>(null);

  useEffect(() => {
    async function periksa() {
      const didukung = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!didukung) return setStatus("tidak-didukung");
      if (Notification.permission === "denied") return setStatus("ditolak");

      try {
        await navigator.serviceWorker.register("/sw.js");
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "aktif" : "mati");
      } catch {
        setStatus("tidak-didukung");
      }
    }
    periksa();
  }, []);

  async function aktifkan() {
    setPesan(null);
    setStatus("proses");
    try {
      const kunci = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!kunci) throw new Error("Kunci VAPID belum diatur.");

      const izin = await Notification.requestPermission();
      if (izin !== "granted") return setStatus(izin === "denied" ? "ditolak" : "mati");

      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: kunciKeUint8Array(kunci),
        }));

      const json = sub.toJSON();
      const hasil = await simpanLangganan({ endpoint: json.endpoint, keys: json.keys });
      if (!hasil.success) {
        await sub.unsubscribe();
        setPesan(hasil.message ?? "Gagal mengaktifkan notifikasi.");
        return setStatus("mati");
      }
      setStatus("aktif");
    } catch (error) {
      console.error(error);
      setPesan("Gagal mengaktifkan notifikasi di browser ini.");
      setStatus("mati");
    }
  }

  async function matikan() {
    setPesan(null);
    setStatus("proses");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await hapusLangganan(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("mati");
    } catch (error) {
      console.error(error);
      setPesan("Gagal menonaktifkan notifikasi.");
      setStatus("aktif");
    }
  }

  const tombol =
    "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-60";

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white px-5 py-4 shadow-[0_10px_30px_-15px_rgba(120,80,0,0.3)]">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg">
          🔔
        </span>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Notifikasi status reservasi</p>
          <p className="text-xs leading-5 text-neutral-500">
            {status === "aktif" && "Aktif di browser ini. Anda akan diberi tahu saat status reservasi berubah."}
            {status === "mati" && "Dapatkan kabar saat reservasi Anda dikonfirmasi atau dibatalkan."}
            {status === "memuat" && "Memeriksa pengaturan notifikasi…"}
            {status === "proses" && "Memproses…"}
            {status === "ditolak" && "Notifikasi diblokir di browser. Izinkan lewat pengaturan situs (ikon gembok di address bar)."}
            {status === "tidak-didukung" && "Browser ini belum mendukung notifikasi."}
          </p>
          {pesan && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {pesan}
            </p>
          )}
        </div>
      </div>

      {status === "mati" && (
        <button type="button" onClick={aktifkan} className={`${tombol} bg-amber-500 text-white hover:bg-amber-600`}>
          Aktifkan notifikasi
        </button>
      )}
      {status === "aktif" && (
        <button
          type="button"
          onClick={matikan}
          className={`${tombol} border border-neutral-300 text-neutral-700 hover:border-amber-500 hover:text-amber-600`}
        >
          Nonaktifkan
        </button>
      )}
      {status === "proses" && (
        <button type="button" disabled className={`${tombol} bg-neutral-200 text-neutral-600`}>
          Memproses…
        </button>
      )}
    </div>
  );
}
