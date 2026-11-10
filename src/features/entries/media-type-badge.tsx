import {
  BookOpen,
  Clapperboard,
  Film,
  ScrollText,
  Sparkles,
  Tv,
  type LucideIcon,
} from "lucide-react";

import {
  MEDIA_TYPE_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<MediaEntry["media_type"], LucideIcon> = {
  anime: Sparkles,
  movie: Clapperboard,
  series: Tv,
  manga: BookOpen,
  manhwa: ScrollText,
  manhua: ScrollText,
  novel: Film,
};

export function MediaTypeBadge({
  type,
  className,
}: {
  type: MediaEntry["media_type"];
  className?: string;
}) {
  const Icon = TYPE_ICON[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-[var(--bg-sunken)] px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide text-[var(--fg-muted)] uppercase",
        className,
      )}
    >
      <Icon className="size-3 opacity-70" aria-hidden />
      {MEDIA_TYPE_LABELS[type]}
    </span>
  );
}
