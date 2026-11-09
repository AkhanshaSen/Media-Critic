"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SpoilerGuard({
  active,
  children,
  className,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!active || revealed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="pointer-events-none select-none blur-md" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 px-4 text-center backdrop-blur-[2px]">
        <p className="text-sm font-medium">Contains spoilers</p>
        <button
          type="button"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold"
          onClick={() => setRevealed(true)}
        >
          Reveal
        </button>
      </div>
    </div>
  );
}
