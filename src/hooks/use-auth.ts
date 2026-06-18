import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "barber" | "customer" | null;

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role;
  profile: { full_name: string; phone: string } | null;
}

export function useAuth(): AuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    role: null,
    profile: null,
  });

  const loadRoleAndProfile = async (user: User | null) => {
    if (!user) {
      setState({ loading: false, session: null, user: null, role: null, profile: null });
      return;
    }
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as Role);
    const role: Role = roleList.includes("admin")
      ? "admin"
      : roleList.includes("barber")
        ? "barber"
        : roleList.includes("customer")
          ? "customer"
          : null;
    setState((s) => ({
      ...s,
      loading: false,
      user,
      session: s.session,
      role,
      profile: profile ?? null,
    }));
  };

  const refresh = async () => {
    const { data } = await supabase.auth.getSession();
    setState((s) => ({ ...s, session: data.session, user: data.session?.user ?? null }));
    await loadRoleAndProfile(data.session?.user ?? null);
  };

  useEffect(() => {
    let mounted = true;
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      if (!mounted) return;
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: true }));
      loadRoleAndProfile(session?.user ?? null);
    });
    refresh();
    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, refresh };
}

export const customerEmail = (phone: string) =>
  `${phone.replace(/[^\d]/g, "")}@bashapp.com`;
export const staffEmail = (phone: string) => `${phone.replace(/[^\d]/g, "")}@staff.bashapp.com`;
export const customerPassword = (phone: string) => `pwd_${phone.replace(/[^\d]/g, "")}_bashapp`;
