"use client";

import { Suspense } from "react";

import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/auth/auth-provider";
import { AppSidebar, MobileTabBar } from "@/components/layout/app-nav";
import { SignOutButton } from "@/components/layout/sign-out-button";

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

  return (
    <header className="border-border sticky top-0 z-10 flex items-center justify-between border-b bg-background/70 px-4 py-3 backdrop-blur-md md:px-8">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            "Signed in"}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {user?.email ?? ""}
        </p>
      </div>
      <SignOutButton />
    </header>
  );
}
