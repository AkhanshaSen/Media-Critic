import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-muted/80 animate-pulse rounded-xl",
        className,
      )}
      aria-hidden
    />
  );
}
