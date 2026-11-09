"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { EntryImage } from "@/features/entries/cover-image";

export function EntryGallery({ stills }: { stills: EntryImage[] }) {
  const withUrl = stills.filter((s) => s.url);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") {
        setActive((i) =>
          i == null ? null : (i + 1) % withUrl.length,
        );
      }
      if (e.key === "ArrowLeft") {
        setActive((i) =>
          i == null ? null : (i - 1 + withUrl.length) % withUrl.length,
        );
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, withUrl.length]);

  if (withUrl.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="border-l-2 border-amber-400 pl-3 text-xl font-bold tracking-tight">
        Gallery
      </h2>

      {/* Cinematic horizontal carousel */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {withUrl.map((still, index) => (
          <button
            key={still.id}
            type="button"
            className="relative aspect-[16/10] w-[min(85%,420px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 shadow-lg shadow-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={() => setActive(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={still.url!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </button>
        ))}
      </div>

      {/* Thumb grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {withUrl.map((still, index) => (
          <button
            key={`grid-${still.id}`}
            type="button"
            className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={() => setActive(index)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={still.url!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {active != null && withUrl[active]?.url ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
            onClick={() => setActive(null)}
          >
            <X className="size-5" />
          </button>
          {withUrl.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:left-6"
                aria-label="Previous"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) =>
                    i == null ? null : (i - 1 + withUrl.length) % withUrl.length,
                  );
                }}
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 md:right-6"
                aria-label="Next"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) =>
                    i == null ? null : (i + 1) % withUrl.length,
                  );
                }}
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withUrl[active].url!}
            alt=""
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-xs text-white/70 tabular-nums">
            {active + 1} / {withUrl.length}
          </p>
        </div>
      ) : null}
    </section>
  );
}
