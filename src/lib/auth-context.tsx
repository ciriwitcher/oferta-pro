import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabase, supabase } from "@/lib/supabase";

type SignUpResult = {
  requiresEmailConfirmation: boolean;
};

export type AuthFlowErrorCode = "EMAIL_ALREADY_REGISTERED";

export class AuthFlowError extends Error {
  code: AuthFlowErrorCode;

  constructor(code: AuthFlowErrorCode, message: string) {
    super(message);
    this.name = "AuthFlowError";
    this.code = code;
  }
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  recoveryMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  resendSignupConfirmation: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateRecoveredPassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function appUrl(path: string) {
  if (typeof window === "undefined") return undefined;
  return new URL(path, window.location.origin).toString();
}

function urlContainsRecoveryToken() {
  if (typeof window === "undefined") return false;
  return (
    window.location.hash.includes("type=recovery") ||
    new URLSearchParams(window.location.search).get("type") === "recovery"
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(urlContainsRecoveryToken);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error("Nie udało się odczytać sesji Supabase:", error);
      setSession(data.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLoading(false);

      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      if (event === "SIGNED_OUT") setRecoveryMode(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      recoveryMode,
      async signIn(email, password) {
        const { error } = await getSupabase().auth.signInWithPassword({
          email: normalizeEmail(email),
          password,
        });
        if (error) throw error;
      },
      async signUp(name, email, password) {
        const { data, error } = await getSupabase().auth.signUp({
          email: normalizeEmail(email),
          password,
          options: {
            emailRedirectTo: appUrl("/auth/confirm"),
            data: {
              full_name: name,
              company_name: name,
            },
          },
        });

        if (error) throw error;

        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new AuthFlowError(
            "EMAIL_ALREADY_REGISTERED",
            "Konto z tym adresem e-mail już istnieje.",
          );
        }

        if (!data.user) throw new Error("Supabase nie utworzył konta. Spróbuj ponownie.");
        return { requiresEmailConfirmation: !data.session };
      },
      async resendSignupConfirmation(email) {
        const { error } = await getSupabase().auth.resend({
          type: "signup",
          email: normalizeEmail(email),
          options: {
            emailRedirectTo: appUrl("/auth/confirm"),
          },
        });
        if (error) throw error;
      },
      async requestPasswordReset(email) {
        const { error } = await getSupabase().auth.resetPasswordForEmail(normalizeEmail(email), {
          redirectTo: appUrl("/reset-password"),
        });
        if (error) throw error;
      },
      async updateRecoveredPassword(password) {
        const client = getSupabase();
        const { error } = await client.auth.updateUser({ password });
        if (error) throw error;

        setRecoveryMode(false);
        const { error: signOutError } = await client.auth.signOut({ scope: "local" });
        if (signOutError) console.error("Hasło zmieniono, ale nie udało się wylogować sesji:", signOutError);
      },
      async signOut() {
        const { error } = await getSupabase().auth.signOut();
        if (error) throw error;
      },
    }),
    [loading, recoveryMode, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth musi być użyte wewnątrz AuthProvider.");
  return context;
}

export function getUserDisplayName(user: User | null) {
  if (!user) return "Użytkowniku";
  const metadata = user.user_metadata ?? {};
  return metadata.company_name || metadata.full_name || user.email || "Użytkowniku";
}
