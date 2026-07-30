import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    async function finishLogin() {
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      navigate({ to: session ? "/dashboard" : "/login", replace: true });
    }
    void finishLogin();
  }, [navigate]);

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-4">
      <p className="text-center text-sm text-muted-foreground">
        {error ? `Nie udało się potwierdzić konta: ${error}` : "Potwierdzanie konta…"}
      </p>
    </div>
  );
}
