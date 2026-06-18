import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/client-EKoJl9CN.js
function createSupabaseClient() {
	return createClient("https://ldwkergwyreogttkhpcg.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkd2tlcmd3eXJlb2d0dGtocGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MzI0MjUsImV4cCI6MjA5NzMwODQyNX0.M_az7lvzw9LADpwiZn3r-ZZPJR96MpgkWTBcDf3R7pg", { auth: {
		storage: typeof window !== "undefined" ? localStorage : void 0,
		persistSession: true,
		autoRefreshToken: true
	} });
}
var _supabase;
var supabase = new Proxy({}, { get(_, prop, receiver) {
	if (!_supabase) _supabase = createSupabaseClient();
	return Reflect.get(_supabase, prop, receiver);
} });
//#endregion
export { supabase as t };
