import Link from "next/link";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function ScreenBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? (
              <span aria-hidden className="text-muted-foreground/50">
                →
              </span>
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground truncate max-w-[12rem] transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate max-w-[16rem]",
                  isLast && "text-foreground font-medium",
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
