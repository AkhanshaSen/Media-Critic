"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard/" : "/login/");
  }, [loading, user, router]);

  return (
    <main className="text-muted-foreground flex min-h-full flex-1 items-center justify-center p-6 text-sm">
      Loading Media Critic…
    </main>
  );
}
