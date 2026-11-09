"use client";

import { useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { validateCoverFile } from "@/features/entries/cover-image";
import { cn } from "@/lib/utils";

export function CoverPicker({
  previewUrl,
  onFile,
  onClearLocal,
  invalid,
  hint,
  disabled,
  aspect = "poster",
  title = "Add a cover poster",
  description = "JPEG, PNG, or WebP up to 5 MB.",
}: {
  previewUrl: string | null;
  onFile: (file: File | null) => void;
  onClearLocal?: () => void;
  invalid?: boolean;
  hint?: string | null;
  disabled?: boolean;
  aspect?: "poster" | "backdrop";
  title?: string;
  description?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function accept(file: File | null) {
    if (!file) {
      setLocalError(null);
      onFile(null);
      return;
    }
    const err = validateCoverFile(file);
    if (err) {
      setLocalError(err);
      onFile(null);
      return;
    }
    setLocalError(null);
    onFile(file);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    },
    onDragLeave: () => setDragOver(false),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      accept(e.dataTransfer.files?.[0] ?? null);
    },
  };

  return (
    <div className="space-y-1.5">
      {previewUrl ? (
        <div
          {...dropHandlers}
          className={cn(
            "border-border flex items-center gap-3 rounded-xl border border-dashed bg-card/40 p-2 transition-colors",
            dragOver && "border-primary bg-primary/10",
            invalid && "border-destructive ring-3 ring-destructive/25",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className={cn(
              "border-border shrink-0 rounded-md border object-cover shadow-sm",
              aspect === "backdrop" ? "h-14 w-24" : "h-20 w-[3.35rem]",
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{title}</p>
            <p className="text-muted-foreground truncate text-xs">{description}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={disabled}
                onClick={openPicker}
              >
                Change
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={disabled}
                onClick={() => {
                  accept(null);
                  onClearLocal?.();
                  if (inputRef.current) inputRef.current.value = "";
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          tabIndex={0}
          data-invalid={invalid ? "true" : undefined}
          role="button"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPicker();
            }
          }}
          onClick={openPicker}
          {...dropHandlers}
          className={cn(
            "border-border relative flex cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-2 border-dashed bg-card/40 p-3 transition-colors",
            aspect === "backdrop"
              ? "min-h-20 w-full"
              : "h-28 w-28 max-w-full",
            dragOver && "border-primary bg-primary/10",
            invalid && "border-destructive ring-3 ring-destructive/25",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <p className="text-center text-xs font-semibold leading-tight">
            {title}
          </p>
          <p className="text-muted-foreground line-clamp-2 max-w-[11rem] text-center text-[10px] leading-snug">
            {description}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            className="h-7 px-2 text-xs"
          >
            Choose image
          </Button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => accept(e.target.files?.[0] ?? null)}
      />
      {localError || hint ? (
        <p
          className={cn(
            "text-xs",
            localError || invalid ? "text-destructive" : "text-amber-200/90",
          )}
        >
          {localError || hint}
        </p>
      ) : null}
    </div>
  );
}
