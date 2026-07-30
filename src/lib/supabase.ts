import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Brak VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(
  supabaseUrl ?? "https://missing-project.supabase.co",
  supabaseKey ?? "missing-public-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function assertSupabaseConfigured() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Brakuje konfiguracji Supabase. Dodaj zmienne VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY w Netlify.",
    );
  }
}
