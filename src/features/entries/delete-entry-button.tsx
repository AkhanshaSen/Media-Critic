"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteEntry } from "@/features/entries/data";

const UNDO_MS = 8000;

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  function clearTimer() {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function scheduleDelete() {
    cancelledRef.current = false;
    setConfirming(false);
    setError(null);

    toast({
      title: "Deleted",
      description: "This title will be removed shortly.",
      durationMs: UNDO_MS,
      action: {
        label: "Undo",
        onClick: () => {
          cancelledRef.current = true;
          clearTimer();
          toast({ title: "Restored", description: "Delete cancelled." });
        },
      },
    });

    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (cancelledRef.current) return;
      startTransition(async () => {
        const result = await deleteEntry(entryId);
        if (!result.ok) {
          setError(result.error);
          toast({ title: "Could not delete", description: result.error });
          return;
        }
        router.push("/library/");
      });
    }, UNDO_MS);
  }

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    scheduleDelete();
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
