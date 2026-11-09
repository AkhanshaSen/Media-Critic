import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-3",
  md: "size-4",
  lg: "size-5",
} as const;

export type RatingStarsProps = {
  value: number | null;
  /** Scale of the stored rating (default 10 → 5 visual stars). */
  max?: number;
  size?: keyof typeof SIZE_CLASS;
  variant?: "dark" | "light";
  showValue?: boolean;
  className?: string;
};

/** Map a 1–max score onto five stars (half-star steps). */
export function RatingStars({
  value,
  max = 10,
  size = "md",
  variant = "dark",
  showValue = false,
  className,
}: RatingStarsProps) {
  const starSize = SIZE_CLASS[size];
  const filled =
    value == null || Number.isNaN(value)
      ? 0
      : Math.max(0, Math.min(5, (value / max) * 5));

  const emptyClass =
    variant === "light" ? "fill-amber-200/80 text-amber-300" : "fill-white/15 text-white/25";
  const fullClass =
    variant === "light"
      ? "fill-amber-500 text-amber-500"
      : "fill-amber-400 text-amber-400";

  const label =
    value == null ? "No rating" : `Rated ${formatScore(value)} out of ${max}`;

  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      role="img"
      aria-label={label}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => {
          const portion = Math.max(0, Math.min(1, filled - i));
          return (
            <span key={i} className={cn("relative inline-flex", starSize)}>
              <Star className={cn(starSize, emptyClass)} strokeWidth={1.5} />
              {portion > 0 ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${portion * 100}%` }}
                >
                  <Star className={cn(starSize, fullClass)} strokeWidth={1.5} />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {showValue ? (
        <span
          className={cn(
            "tabular-nums font-semibold",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm",
            variant === "light" ? "text-amber-800" : "text-amber-300",
          )}
        >
          {value == null ? "—" : formatScore(value)}
        </span>
      ) : null}
    </span>
  );
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
