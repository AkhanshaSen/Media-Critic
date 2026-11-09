"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

export function GoogleLoginButton({ nextPath = "/dashboard/" }: { nextPath?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${getSiteUrl()}/auth/callback/?next=${encodeURIComponent(nextPath)}`;

    // Let the browser hit authorize once (no pre-flight fetch) to avoid bad_oauth_state.
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (oauthError || !data.url) {
      setLoading(false);
      console.error("Google OAuth start failed:", oauthError?.message);
      setError("Could not start Google sign-in. Try again in a moment.");
      return;
    }

    window.location.assign(data.url);
  }

  return (
    <div className="space-y-3">
      <Button type="button" className="w-full" disabled={loading} onClick={signIn}>
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
