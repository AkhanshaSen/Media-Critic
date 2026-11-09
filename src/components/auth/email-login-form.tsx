"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

export function EmailLoginForm({ nextPath = "/dashboard/" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSent(false);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setLoading(false);
      setError("Enter a valid email address.");
      return;
    }

    const supabase = createClient();
    const emailRedirectTo = `${getSiteUrl()}/auth/callback/?next=${encodeURIComponent(nextPath)}`;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo },
    });

    setLoading(false);

    if (otpError) {
      setError("Could not send the sign-in link. Try again in a moment.");
      return;
    }

    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <Button type="submit" variant="outline" className="w-full" disabled={loading}>
        {loading ? "Sending…" : "Send magic link"}
      </Button>
      {sent ? (
        <p className="text-muted-foreground text-sm">
          Check your inbox for a sign-in link. Open it on this device to finish.
        </p>
      ) : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </form>
  );
}
