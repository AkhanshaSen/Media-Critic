"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { MAX_STILLS, validateCoverFile } from "@/features/entries/cover-image";
import { cn } from "@/lib/utils";

type StillPreview = { key: string; file: File; url: string };

export function StillsPicker({
  files,
  onChange,
  existingCount = 0,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  existingCount?: number;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<StillPreview[]>([]);

  const room = Math.max(0, MAX_STILLS - existingCount - files.length);

  function syncPreviews(nextFiles: File[]) {
    setPreviews((prev) => {
      for (const p of prev) URL.revokeObjectURL(p.url);
      return nextFiles.map((file, i) => ({
        key: `${file.name}-${file.size}-${i}`,
        file,
        url: URL.createObjectURL(file),
      }));
    });
  }

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    for (const file of incoming) {
      const err = validateCoverFile(file);
      if (err) {
        setError(err);
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    const next = [...files, ...accepted].slice(0, MAX_STILLS - existingCount);
    if (next.length < files.length + accepted.length) {
      setError(`You can add up to ${MAX_STILLS} stills per title.`);
    } else {
      setError(null);
    }
    onChange(next);
    syncPreviews(next);
  }

  function removeAt(index: number) {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    syncPreviews(next);
    setError(null);
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-border flex flex-col items-start gap-2 rounded-xl border border-dashed bg-card/40 p-3",
          disabled && "opacity-50",
        )}
      >
        <div>
          <p className="text-sm font-semibold">Add more photos</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Up to {MAX_STILLS} stills ({room} left). JPEG, PNG, or WebP · 5 MB
            each.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || room <= 0}
          onClick={() => inputRef.current?.click()}
        >
          Choose photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          disabled={disabled || room <= 0}
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {previews.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {previews.map((p, index) => (
            <li key={p.key} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className="border-border h-20 w-28 rounded-lg border object-cover"
              />
              <button
                type="button"
                className="bg-background/90 absolute -top-1.5 -right-1.5 rounded-full px-1.5 text-xs font-bold shadow"
                disabled={disabled}
                onClick={() => removeAt(index)}
                aria-label="Remove still"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
