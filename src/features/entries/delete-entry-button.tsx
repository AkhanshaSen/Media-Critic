"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteEntry } from "@/features/entries/data";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteEntry(entryId);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      router.push("/library/");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant={confirming ? "destructive" : "outline"}
        disabled={pending}
        onClick={onDelete}
      >
        {pending ? "Deleting…" : confirming ? "Confirm delete" : "Delete"}
      </Button>
      {confirming && !pending ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
        >
          Cancel
        </Button>
      ) : null}
      {error ? <p className="text-destructive w-full text-sm">{error}</p> : null}
    </div>
  );
}
