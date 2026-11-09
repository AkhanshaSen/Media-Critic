"use client";

import { Suspense, useEffect, useState } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { AppSidebar, MobileTabBar } from "@/components/layout/app-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { createClient } from "@/lib/supabase/client";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-full flex-1">
        <Suspense
          fallback={
            <aside className="border-sidebar-border hidden w-56 border-r md:block" />
          }
        >
          <AppSidebar />
        </Suspense>
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          <div className="flex-1 px-4 py-6 pb-20 md:px-8 md:pb-8">{children}</div>
          <Suspense fallback={<div className="h-12 border-t md:hidden" />}>
            <MobileTabBar />
          </Suspense>
        </div>
      </div>
    </RequireAuth>
  );
}

function AppHeader() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAvatarUrl(null);
      return;
    }

    const metaAvatar =
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : typeof user.user_metadata?.picture === "string"
          ? user.user_metadata.picture
          : null;

    let active = true;
    const supabase = createClient();

    void (async () => {
      const { data } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setAvatarUrl(data?.avatar_url || metaAvatar);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "Signed in";

  return (
    <header className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs vary by provider
          <img
            src={avatarUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-full object-cover ring-2 ring-amber-400/40"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {user?.email ?? ""}
          </p>
        </div>
      </div>
      <SignOutButton />
    </header>
  );
}
