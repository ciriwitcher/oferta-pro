import { createClient } from "@supabase/supabase-js";

// Te wartości są publiczną konfiguracją klienta Supabase. Bezpieczeństwo danych
// zapewniają polityki RLS w bazie, nie ukrywanie publishable key.
const defaultSupabaseUrl = "https://mimbwkllauuvmpablzgr.supabase.co";
const defaultSupabasePublishableKey = "sb_publishable_E-HYCCY8JRO36g9jhQP__g_wo4Gd22j";

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) || defaultSupabaseUrl;
const supabasePublishableKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  defaultSupabasePublishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : "Brakuje konfiguracji Supabase. Ustaw VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w zmiennych środowiskowych.";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase nie jest skonfigurowany.");
  }

  return supabase;
}
