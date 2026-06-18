import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_CONFIG } from "./config";

function parseSupabaseCookie(cookies: string): { access_token: string } | null {
  // Supabase stores session in cookie named sb-<project-ref>-auth-token
  // The cookie value is a base64-encoded JSON with access_token
  const cookieName = `sb-${SUPABASE_CONFIG.url.split("//")[1].split(".")[0]}-auth-token`;
  const match = cookies
    .split("; ")
    .find((c) => c.startsWith(`${cookieName}=`));
  if (!match) return null;
  try {
    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(value);
    if (parsed?.access_token) return parsed;
    // Supabase v2 wraps it in { current: { access_token } }
    if (parsed?.current?.access_token) return { access_token: parsed.current.access_token };
  } catch {
    // ignore
  }
  return null;
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const SUPABASE_URL =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
    const SUPABASE_PUBLISHABLE_KEY =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      SUPABASE_CONFIG.anonKey;

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    let token: string | null = null;

    // 1. Try Authorization header first
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "");
    }

    // 2. Fall back to reading Supabase cookie
    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const session = parseSupabaseCookie(cookieHeader);
        if (session?.access_token) token = session.access_token;
      }
    }

    if (!token) {
      throw new Error("Unauthorized: No session found");
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw new Error("Unauthorized: Invalid token");
    }

    return next({
      context: {
        supabase,
        userId: data.user.id,
        claims: data.user,
      },
    });
  },
);
