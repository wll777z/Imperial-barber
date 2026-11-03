import "server-only";
import { createClient } from "@supabase/supabase-js";
export function getServerConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) throw Error("UNAVAILABLE");
  return { url, anonKey, serviceRoleKey };
}
export function serviceClient() {
  const { url, serviceRoleKey } = getServerConfig();
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
