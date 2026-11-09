"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EmailLoginForm } from "@/components/auth/email-login-form";
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
            Sign in to your private shelf and reviews. Each account only sees its
            own titles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {authError ? (
            <p className="text-destructive text-sm">
              Sign-in did not complete (expired link, cancelled prompt, or
              missing auth code). Prefer{" "}
              <code className="text-xs">http://localhost:3000</code> locally (not
              127.0.0.1) and try again.
            </p>
          ) : null}
          {loading ? (
            <p className="text-muted-foreground text-sm">Checking session…</p>
          ) : (
            <>
              <GoogleLoginButton nextPath={next} />
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card text-muted-foreground px-2">
                    or email
                  </span>
                </div>
              </div>
              <EmailLoginForm nextPath={next} />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
