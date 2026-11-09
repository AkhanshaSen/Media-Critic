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

const TYPE_META: Record<
  MediaEntry["media_type"],
  { icon: LucideIcon; className: string }
> = {
  anime: {
    icon: Sparkles,
    className: "bg-violet-500/20 text-violet-200 ring-violet-400/30",
  },
  movie: {
    icon: Clapperboard,
    className: "bg-rose-500/20 text-rose-200 ring-rose-400/30",
  },
  series: {
    icon: Tv,
    className: "bg-sky-500/20 text-sky-200 ring-sky-400/30",
  },
  manga: {
    icon: BookOpen,
    className: "bg-amber-500/20 text-amber-200 ring-amber-400/30",
  },
  manhwa: {
    icon: ScrollText,
    className: "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-400/30",
  },
  manhua: {
    icon: ScrollText,
    className: "bg-teal-500/20 text-teal-200 ring-teal-400/30",
  },
  novel: {
    icon: Film,
    className: "bg-lime-500/20 text-lime-200 ring-lime-400/30",
  },
};

export function MediaTypeBadge({
  type,
  className,
}: {
  type: MediaEntry["media_type"];
  className?: string;
}) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide uppercase ring-1",
        meta.className,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {MEDIA_TYPE_LABELS[type]}
    </span>
  );
}
