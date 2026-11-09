"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard/";
  const authError = searchParams.get("error") === "auth";

  useEffect(() => {
    if (!loading && user) {
      router.replace(next.startsWith("/") ? next : "/dashboard/");
    }
  }, [loading, user, router, next]);

  return (
    <main className="from-background via-background to-primary/5 flex min-h-full flex-1 items-center justify-center bg-gradient-to-b p-6">
      <Card className="w-full max-w-md border-white/10 shadow-2xl shadow-black/40">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl tracking-tight">Media Critic</CardTitle>
          <CardDescription>
            Sign in with Google to manage your private shelf of ratings and
            reviews.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {authError ? (
            <p className="text-destructive text-sm">
              Sign-in did not complete (expired link, cancelled Google prompt, or
              missing OAuth code). Use{" "}
              <code className="text-xs">http://localhost:3000</code> (not
              127.0.0.1) and try Continue with Google again.
            </p>
          ) : null}
          {loading ? (
            <p className="text-muted-foreground text-sm">Checking session…</p>
          ) : (
            <GoogleLoginButton nextPath={next} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
