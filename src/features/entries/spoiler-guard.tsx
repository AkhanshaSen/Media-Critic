"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Inert wrapper when parent gates spoilers (keeps call sites simple). */
export function SpoilerGuard({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  if (active) return null;
  return <>{children}</>;
}

export function SpoilerGate({
  active,
  revealed,
  onReveal,
}: {
  active: boolean;
  revealed: boolean;
  onReveal: () => void;
}) {
  if (!active || revealed) return null;

  return (
    <div className="border-border/80 bg-muted/40 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5">
      <p className="text-muted-foreground text-sm">
        Verdict and review are hidden — spoilers
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onReveal}>
        Reveal
      </Button>
    </div>
  );
}
