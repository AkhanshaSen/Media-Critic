"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function fromIso(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const d = parseISO(value);
  return isValid(d) ? d : undefined;
}

export function DatePicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
  placeholder = "Pick a date",
}: {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = fromIso(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "border-input bg-background inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border px-2.5 text-sm font-normal outline-none transition-colors",
          "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          !value && "text-muted-foreground",
          invalid &&
            "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50",
        )}
      >
        <CalendarIcon className="size-4 shrink-0 opacity-70" />
        <span className="truncate">
          {selected ? format(selected, "MMM d, yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="p-2">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) {
              onChange("");
              return;
            }
            onChange(toIsoDate(date));
            setOpen(false);
          }}
          defaultMonth={selected}
        />
        {value ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground mt-2 w-full text-xs underline"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear date
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
