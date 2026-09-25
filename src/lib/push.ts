import { SUPABASE_CONFIG } from "@/integrations/supabase/config";
import { savePushSubscription } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
}

const UNSUPPORTED: PushState = {
  supported: false,
  permission: "unsupported",
  subscribed: false,
};

function supported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  await navigator.serviceWorker.register("/sw.js");
  return navigator.serviceWorker.ready;
}

export async function getPushState(): Promise<PushState> {
  if (!supported()) return UNSUPPORTED;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    return {
      supported: true,
      permission: Notification.permission,
      subscribed: !!sub,
    };
  } catch {
    return UNSUPPORTED;
  }
}

/** Must be called from a user gesture (button click) so the browser shows the permission prompt. */
export async function enablePushNotifications(): Promise<PushState> {
  if (!supported()) return UNSUPPORTED;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { supported: true, permission, subscribed: false };
  }
  try {
    const reg = await registration();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(SUPABASE_CONFIG.vapidPublicKey),
      }));
    const json = sub.toJSON();
    if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
      await savePushSubscription({
        data: { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
    }
    return { supported: true, permission, subscribed: true };
  } catch {
    return { supported: true, permission, subscribed: false };
  }
}

export async function disablePushNotifications(): Promise<PushState> {
  if (!supported()) return UNSUPPORTED;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe().catch(() => {});
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    }
  } catch {
    /* already gone */
  }
  return { supported: true, permission: Notification.permission, subscribed: false };
}
