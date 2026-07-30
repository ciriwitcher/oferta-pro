// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import netlify from "@netlify/vite-plugin-tanstack-start";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_DATABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const publicSupabaseEnv: Record<string, string> = {};

if (supabaseUrl) {
  publicSupabaseEnv["import.meta.env.VITE_SUPABASE_URL"] = JSON.stringify(supabaseUrl);
}

if (supabaseAnonKey) {
  publicSupabaseEnv["import.meta.env.VITE_SUPABASE_ANON_KEY"] = JSON.stringify(supabaseAnonKey);
}

export default defineConfig({
  vite: {
    plugins: [netlify()],
    // Netlify's Supabase integration creates SUPABASE_* variables.
    // The browser client only receives these two explicitly public values.
    define: publicSupabaseEnv,
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
