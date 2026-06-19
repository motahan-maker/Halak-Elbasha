// Service worker: background polling + notifications
const POLL_INTERVAL = 10000;
let pollTimer = null;
let barberId = null;
let supabaseUrl = null;
let supabaseKey = null;
let knownBookingIds = new Set();

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (e) => {
  const { type } = e.data || {};
  if (type === "CONFIG") {
    barberId = e.data.barberId;
    supabaseUrl = e.data.supabaseUrl;
    supabaseKey = e.data.supabaseKey;
    // Load known IDs from storage
    e.waitUntil(
      caches.open("bg-v1").then(async (cache) => {
        try {
          const res = await cache.match("/known-ids");
          if (res) {
            const ids = await res.json();
            knownBookingIds = new Set(ids);
          }
        } catch {}
      })
    );
    startPolling();
  } else if (type === "STOP") {
    stopPolling();
  } else if (type === "SHOW_NOTIFICATION") {
    showNotif(e.data.title, e.data.body);
  }
});

function startPolling() {
  stopPolling();
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}

async function poll() {
  if (!barberId || !supabaseUrl || !supabaseKey) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const url = `${supabaseUrl}/rest/v1/bookings?barber_id=eq.${barberId}&status=eq.booked&order=created_at.desc&limit=20`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!res.ok) return;
    const bookings = await res.json();
    if (knownBookingIds.size > 0) {
      for (const b of bookings) {
        if (!knownBookingIds.has(b.id)) {
          const desc = `${b.customer_name} — ${b.service_name} ${b.booking_time?.slice(0, 5)}`;
          showNotif("حجز جديد!", desc);
        }
      }
    }
    knownBookingIds = new Set(bookings.map((b) => b.id));
    // Persist known IDs
    const cache = await caches.open("bg-v1");
    const blob = new Blob([JSON.stringify([...knownBookingIds])], { type: "application/json" });
    await cache.put("/known-ids", new Response(blob));
  } catch {}
}

function showNotif(title, body) {
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: "new-booking",
    requireInteraction: true,
  });
}

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow("/");
    })
  );
});
