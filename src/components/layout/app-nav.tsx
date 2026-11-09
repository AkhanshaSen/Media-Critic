"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard/", label: "Home", enabled: true },
  { href: "/library/", label: "Library", enabled: true },
  { href: "/add/", label: "Add", enabled: true },
  { href: "/stats/", label: "Stats", enabled: false },
  { href: "/settings/", label: "Settings", enabled: false },
] as const;

function isActivePath(pathname: string, href: string) {
  if (pathname === href || pathname === href.replace(/\/$/, "")) return true;
  if (href === "/library/" && pathname.includes("/entries/")) return true;
  return false;
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-56 shrink-0 border-r md:flex md:flex-col">
      <div className="border-sidebar-border from-primary/10 border-b bg-gradient-to-b to-transparent px-5 py-6">
        <Link href="/dashboard/" className="text-lg font-semibold tracking-tight">
          Media Critic
        </Link>
        <p className="text-muted-foreground mt-1 text-xs">Your private shelf</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="text-muted-foreground cursor-not-allowed rounded-md px-3 py-2 text-sm"
                title="Coming later"
              >
                {item.label}
                <span className="ml-2 text-[10px] uppercase tracking-wide opacity-70">
                  soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/70",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-border bg-background/95 sticky bottom-0 z-20 flex border-t backdrop-blur md:hidden"
      aria-label="Mobile"
    >
      {navItems.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              className="text-muted-foreground flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-0.5 py-2 text-[11px]"
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
              isActive ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
