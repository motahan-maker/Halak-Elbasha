// Service worker: background polling + notification display.
// Web Push subscriptions are created from the page (src/lib/push.ts) so the
// browser permission prompt is tied to a real user gesture.
const POLL_INTERVAL = 60000;
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

// Push event handler
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let payload = {};
  try {
    payload = e.data.json();
  } catch {
    payload = { body: e.data.text() };
  }
  const title = payload.title || "حجز جديد!";
  const body = payload.body || "";
  e.waitUntil(showNotif(title, body, payload.url));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            try {
              client.navigate(target);
            } catch {}
          }
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});

// Background polling
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
    const url = `${supabaseUrl}/rest/v1/bookings?barber_id=eq.${barberId}&status=eq.booked&order=created_at.desc&limit=20`;
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
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
    const cache = await caches.open("bg-v1");
    const blob = new Blob([JSON.stringify([...knownBookingIds])], { type: "application/json" });
    await cache.put("/known-ids", new Response(blob));
  } catch {}
}

function showNotif(title, body, url) {
  self.registration.showNotification(title, {
    body,
    icon: "/icon.svg",
    badge: "/icon-maskable.svg",
    tag: "new-booking",
    dir: "rtl",
    lang: "ar",
    requireInteraction: true,
    data: { url: url || "/" },
  });
}
