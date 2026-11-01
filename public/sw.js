/* Service worker RestoReserve — menerima Web Push dan menampilkan notifikasi. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Format payload dari server: { title, body, url, tag }
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "RestoReserve";
  const options = {
    body: data.body || "",
    icon: "/favicon.ico",
    tag: data.tag, // notifikasi dengan tag sama saling menggantikan
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Klik notifikasi: fokus ke tab yang sudah terbuka, atau buka tab baru
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((daftar) => {
      for (const klien of daftar) {
        if (new URL(klien.url).pathname === url && "focus" in klien) return klien.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});