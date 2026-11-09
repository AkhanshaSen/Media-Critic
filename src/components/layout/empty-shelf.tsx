import Link from "next/link";

import { cn } from "@/lib/utils";

export function EmptyShelfIllustration({
  title,
  description,
  primaryHref = "/add/",
  primaryLabel = "Add your first title",
  secondaryHref,
  secondaryLabel,
  variant = "default",
}: {
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  variant?: "default" | "shelf";
}) {
  const shelf = variant === "shelf";

  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed p-8 text-center sm:p-10",
        shelf
          ? "border-[var(--shelf-border)] bg-[var(--shelf-surface)]"
          : "border-border",
      )}
    >
      <svg
        viewBox="0 0 120 80"
        className="text-muted-foreground/40 mx-auto h-16 w-24"
        aria-hidden
      >
        <rect
          x="18"
          y="12"
          width="28"
          height="40"
          rx="3"
          fill="currentColor"
          opacity="0.35"
        />
        <rect
          x="46"
          y="8"
          width="28"
          height="48"
          rx="3"
          fill="currentColor"
          opacity="0.55"
        />
        <rect
          x="74"
          y="16"
          width="28"
          height="36"
          rx="3"
          fill="currentColor"
          opacity="0.4"
        />
      </svg>
      <p className="mt-4 text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
        {title}
      </p>
      <p
        className={cn(
          "mt-2 text-sm",
          shelf ? "shelf-muted" : "text-muted-foreground",
        )}
      >
        {description}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primaryHref}
          className={cn(
            "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold",
            shelf
              ? "shelf-cta"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link
            href={secondaryHref}
            className="border-border hover:bg-muted inline-flex min-h-11 items-center rounded-lg border px-3 text-sm font-medium"
          >
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
