import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--r-md)] bg-[linear-gradient(90deg,var(--bg-sunken)_25%,var(--bg-raised)_50%,var(--bg-sunken)_75%)] bg-[length:200%_100%]",
        "motion-safe:animate-[shimmer_1.4s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    />
  );
}
