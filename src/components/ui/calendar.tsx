"use client";

import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

import "react-day-picker/style.css";

export function Calendar({
  className,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("rdp-root text-sm [--rdp-accent-color:var(--primary)]", className)}
      {...props}
    />
  );
}
