import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { detectRole, signOut, AppUser } from "../lib/auth";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session from Supabase and detect role
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        const appUser = await detectRole();
        if (mounted) setUser(appUser);
      }
      if (mounted) setLoading(false);
    }

    restoreSession();

    // Listen for auth state changes (token refresh, sign-out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session) {
          const appUser = await detectRole();
          setUser(appUser);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setLoading(false);
        return { error: "Invalid email or password." };
      }

      const appUser = await detectRole();
      if (!appUser) {
        await supabase.auth.signOut();
        setLoading(false);
        return {
          error: "This account does not have access. Contact your administrator.",
        };
      }

      // Mark agent as online immediately after login
      if (appUser.role === "agent") {
        await supabase
          .from("agents")
          .update({ status: "online" })
          .eq("id", appUser.profileId);
      }

      setUser(appUser);
      setLoading(false);
      return { error: null };
    },
    []
  );

  const logout = useCallback(async () => {
    // Mark agent as offline before signing out
    if (user?.role === "agent") {
      await supabase
        .from("agents")
        .update({ status: "offline" })
        .eq("id", user.profileId);
    }
    await signOut();
    setUser(null);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
