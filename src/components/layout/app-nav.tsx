"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Home,
  Library,
  PlusCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems: {
  href: string;
  label: string;
  enabled: boolean;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard/", label: "Shelf", enabled: true, icon: Home },
  { href: "/library/", label: "Library", enabled: true, icon: Library },
  { href: "/add/", label: "Add", enabled: true, icon: PlusCircle },
  { href: "/stats/", label: "Stats", enabled: false, icon: BarChart2 },
  { href: "/settings/", label: "Settings", enabled: false, icon: Settings },
];

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
        <Link
          href="/dashboard/"
          className="relative text-xl font-bold tracking-tight font-[family-name:var(--font-display)]"
        >
          Media Critic
        </Link>
        <p className="relative mt-1 text-xs text-[var(--fg-muted)]">
          Your reviews, one shelf
        </p>
        <div className="relative mt-4 h-px w-12 bg-gradient-to-r from-[var(--accent)]/80 to-transparent" />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {navItems.map((item) => {
          const isActive = isActivePath(pathname, item.href);
          const Icon = item.icon;

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-[var(--r-md)] px-3 py-2.5 text-sm text-[var(--fg-subtle)]"
                title="Coming later"
              >
                <Icon className="size-4 opacity-60" aria-hidden />
                {item.label}
                <span className="ml-auto text-[10px] tracking-wide uppercase opacity-70">
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
                "flex items-center gap-2.5 rounded-[var(--r-md)] border-l-2 border-transparent px-3 py-2.5 text-sm transition-[background-color,border-color] duration-100 ease-out",
                isActive
                  ? "border-l-[var(--accent)] bg-[var(--accent-dim)] font-semibold text-[var(--fg-base)]"
                  : "hover:bg-sidebar-accent/70 text-[var(--fg-muted)]",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
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
        const Icon = item.icon;

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              className="flex flex-1 cursor-not-allowed flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-[var(--fg-subtle)]"
            >
              <Icon className="size-4 opacity-50" aria-hidden />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors duration-100 ease-out",
              isActive
                ? "font-semibold text-[var(--accent)]"
                : "text-[var(--fg-muted)]",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
