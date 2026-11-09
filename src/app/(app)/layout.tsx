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
          <div className="flex-1 px-4 py-6 md:px-8">{children}</div>
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
    <header className="border-border from-background/80 to-background sticky top-0 z-10 flex items-center justify-between border-b bg-gradient-to-r px-4 py-3 backdrop-blur md:px-8">
      <p className="text-muted-foreground truncate text-sm">
        {user?.email ?? "Signed in"}
      </p>
      <SignOutButton />
    </header>
  );
}
