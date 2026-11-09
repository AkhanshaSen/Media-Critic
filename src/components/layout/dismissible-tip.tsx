"use client";

import { useState } from "react";
import { X } from "lucide-react";

const STORAGE_PREFIX = "media-critic-hide-tip:";

function shouldShow(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(STORAGE_PREFIX + id) === "1") return false;
    if (window.sessionStorage.getItem(STORAGE_PREFIX + id) === "1") return false;
    return true;
  } catch {
    return true;
  }
}

export function DismissibleTip({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(() => shouldShow(id));
  const [dontShow, setDontShow] = useState(false);

  function dismiss() {
    try {
      if (dontShow) {
        window.localStorage.setItem(STORAGE_PREFIX + id, "1");
      } else {
        window.sessionStorage.setItem(STORAGE_PREFIX + id, "1");
      }
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="border-primary/20 from-primary/10 relative rounded-2xl border bg-gradient-to-r to-transparent px-4 py-3 pr-12 text-sm">
      {children}
      <label className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={dontShow}
          onChange={(e) => setDontShow(e.target.checked)}
          className="accent-amber-400 size-3.5"
        />
        Don&apos;t show again
      </label>
      <button
        type="button"
        className="hover:bg-muted absolute top-2 right-2 inline-flex size-9 items-center justify-center rounded-lg"
        aria-label="Dismiss tip"
        onClick={dismiss}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
