"use client";

import { useRef, useState } from "react";

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
}: {
  previewUrl: string | null;
  onFile: (file: File | null) => void;
  onClearLocal?: () => void;
  invalid?: boolean;
  hint?: string | null;
  disabled?: boolean;
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

  return (
    <div className="space-y-2">
      <div
        tabIndex={0}
        data-invalid={invalid ? "true" : undefined}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0] ?? null;
          accept(file);
        }}
        className={cn(
          "border-border relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed bg-card/40 p-4 transition-colors",
          dragOver && "border-primary bg-primary/10",
          invalid && "border-destructive ring-3 ring-destructive/25",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Cover preview"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="relative z-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold">Add a cover poster</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            Recommended — JPEG, PNG, or WebP up to 5 MB. Drop a file or click to
            browse.
          </p>
          <Button type="button" size="sm" variant="secondary" disabled={disabled}>
            Choose image
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
        />
      </div>
      {previewUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="border-border h-24 w-16 rounded-lg border object-cover shadow-md"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => {
              accept(null);
              onClearLocal?.();
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove selection
          </Button>
        </div>
      ) : null}
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
