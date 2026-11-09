"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = pathname && pathname !== "/" ? pathname : "/dashboard";
      router.replace(`/login/?next=${encodeURIComponent(next)}`);
    }
  }, [loading, user, router, pathname]);

  if (loading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-10 text-sm">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center p-10 text-sm">
        Redirecting to sign in…
      </div>
    );
  }

  return children;
}
