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
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-60 shrink-0 border-r md:flex md:flex-col">
      <div className="border-sidebar-border relative overflow-hidden border-b px-5 py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/25 via-violet-600/10 to-transparent" />
        <Link
          href="/dashboard/"
          className="relative text-xl font-bold tracking-tight"
        >
          Media Critic
        </Link>
        <p className="text-muted-foreground relative mt-1 text-xs">
          Your private shelf
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="text-muted-foreground cursor-not-allowed rounded-xl px-3 py-2.5 text-sm"
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
                "rounded-xl px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "bg-sky-500/20 text-sky-100 font-semibold shadow-inner ring-1 ring-sky-400/30"
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
              isActive
                ? "text-sky-200 font-semibold"
                : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
