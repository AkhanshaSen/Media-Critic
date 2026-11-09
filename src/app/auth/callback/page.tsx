"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { appPath } from "@/lib/site";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="text-muted-foreground flex min-h-full flex-1 items-center justify-center p-6 text-sm">
          Completing sign-in…
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

function goTo(path: string) {
  // Hard navigation avoids Next.js "Router action dispatched before initialization"
  // after OAuth redirects / HMR in local dev. Prefix basePath for GitHub Pages.
  window.location.assign(appPath(path));
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"working" | "error">("working");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    const nextRaw = searchParams.get("next") || "/dashboard/";
    const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard/";
    const error = searchParams.get("error");
    const code = searchParams.get("code");
    const supabase = createClient();
    let active = true;

    if (error) {
      goTo("/login/?error=auth");
      return;
    }

    async function finishWithCode(authCode: string) {
      // OAuth codes are single-use; persist across Strict Mode remounts.
      const exchangeKey = `mc_oauth_exchanged:${authCode}`;
      if (sessionStorage.getItem(exchangeKey) === "1") {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          await ensureUserProfile(supabase);
          if (!active) return;
          goTo(next);
          return;
        }
        setStatus("error");
        setMessage("Sign-in link already used. Try again from login.");
        goTo("/login/?error=auth");
        return;
      }

      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(authCode);

      if (!active) return;

      if (exchangeError) {
        setStatus("error");
        setMessage(
          exchangeError.message ||
            "Could not complete sign-in. Try again from login.",
        );
        goTo("/login/?error=auth");
        return;
      }

      sessionStorage.setItem(exchangeKey, "1");
      await ensureUserProfile(supabase);
      if (!active) return;
      goTo(next);
    }

    async function finishWithoutCode() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        await ensureUserProfile(supabase);
        if (!active) return;
        goTo(next);
        return;
      }

      // Brief wait for late session hydration / auth events.
      const timeoutMs = 3000;
      await new Promise<void>((resolve) => {
        const timer = window.setTimeout(() => {
          subscription.unsubscribe();
          resolve();
        }, timeoutMs);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (_event: AuthChangeEvent, session: Session | null) => {
            if (!session) return;
            window.clearTimeout(timer);
            subscription.unsubscribe();
            void (async () => {
              await ensureUserProfile(supabase);
              goTo(next);
              resolve();
            })();
          },
        );
      });

      if (!active) return;

      const again = await supabase.auth.getSession();
      if (again.data.session) {
        await ensureUserProfile(supabase);
        if (!active) return;
        goTo(next);
        return;
      }

      setStatus("error");
      setMessage(
        "Sign-in link expired or incomplete (no OAuth code). Try again from login.",
      );
      goTo("/login/?error=auth");
    }

    if (code) {
      void finishWithCode(code);
    } else {
      void finishWithoutCode();
    }

    return () => {
      active = false;
    };
  }, [searchParams]);

  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <p
        className={
          status === "error"
            ? "text-destructive text-sm"
            : "text-muted-foreground text-sm"
        }
      >
        {message}
      </p>
      {status === "error" ? (
        <a href={appPath("/login/")} className="text-primary text-sm underline">
          Back to login
        </a>
      ) : null}
    </main>
  );
}
