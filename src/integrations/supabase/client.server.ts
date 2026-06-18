// Server-side Supabase client with service role key - bypasses RLS.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { SUPABASE_CONFIG } from "./config";

function createSupabaseAdminClient() {
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_CONFIG.url;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not set. Go to Vercel → Settings → Environment Variables and add it.",
    );
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it in Vercel → Settings → Environment Variables.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createSupabaseAdminClient>,
  {
    get(_, prop, receiver) {
      if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
      return Reflect.get(_supabaseAdmin, prop, receiver);
    },
  },
);
