"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AuthChangeEvent,
  Session,
  User,
} from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const ensuredForUser = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function ensureOnce(nextSession: Session | null) {
      const uid = nextSession?.user?.id ?? null;
      if (!uid || ensuredForUser.current === uid) return;
      ensuredForUser.current = uid;
      await ensureUserProfile(supabase);
    }

    supabase.auth
      .getSession()
      .then(async ({ data }: { data: { session: Session | null } }) => {
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
        if (data.session) {
          void ensureOnce(data.session);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, nextSession: Session | null) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setLoading(false);
        if (!nextSession) {
          ensuredForUser.current = null;
          return;
        }
        void ensureOnce(nextSession);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    ensuredForUser.current = null;
    setUser(null);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ user, session, loading, signOut }),
    [user, session, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
