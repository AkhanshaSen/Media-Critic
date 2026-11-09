"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { DismissibleTip } from "@/components/layout/dismissible-tip";
import { EmptyShelfIllustration } from "@/components/layout/empty-shelf";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import {
  ENTRY_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";
import { cn } from "@/lib/utils";

const ALL = "__all__";

export default function LibraryPage() {
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"updated" | "rating" | "title" | "year">(
    "updated",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listEntries({
      q: q || undefined,
      media_type: type || undefined,
      status: status || undefined,
      sort,
    });
    setEntries(list);
    setLoading(false);
  }, [q, type, status, sort]);

  useEffect(() => {
    // Client data fetch for static export (GHP) — load entries when filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional async shelf load
    void load();
  }, [load]);

  const hasFilters = Boolean(q || type || status);

  function clearAll() {
    setQ("");
    setType("");
    setStatus("");
  }

  const filterForm = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <p className="text-muted-foreground sm:col-span-2 lg:col-span-4 text-xs">
        Filters apply automatically as you change them.
      </p>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title…"
        className="lg:col-span-1"
      />

      <Select
        value={type || ALL}
        onValueChange={(v) => setType(!v || v === ALL ? "" : String(v))}
      >
        <SelectTrigger className="h-9 w-full min-w-0">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {MEDIA_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {MEDIA_TYPE_LABELS[t]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status || ALL}
        onValueChange={(v) => setStatus(!v || v === ALL ? "" : String(v))}
      >
        <SelectTrigger className="h-9 w-full min-w-0">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {ENTRY_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) => {
          const next = String(v || "updated");
          if (
            next === "updated" ||
            next === "rating" ||
            next === "title" ||
            next === "year"
          ) {
            setSort(next);
          }
        }}
      >
        <SelectTrigger className="h-9 w-full min-w-0">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Recently updated</SelectItem>
          <SelectItem value="rating">Rating</SelectItem>
          <SelectItem value="title">Title</SelectItem>
          <SelectItem value="year">Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title="Library"
        description={`Search and filter your shelf · ${entries.length} title${entries.length === 1 ? "" : "s"}`}
        breadcrumb={[
          { label: "Shelf", href: "/dashboard/" },
          { label: "Library" },
        ]}
        action={
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold shadow-md shadow-amber-900/20 sm:min-h-9"
          >
            Add title
          </Link>
        }
      />

      <DismissibleTip id="library-filters">
        Tip: filter chips below make it easy to clear one filter at a time — or
        Clear all.
      </DismissibleTip>

      <div className="flex flex-wrap items-center gap-2 md:hidden">
        <button
          type="button"
          className="border-border hover:bg-muted inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
        </button>
      </div>

      <div className="border-border bg-card/40 hidden rounded-2xl border p-4 md:block">
        {filterForm}
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="border-border bg-background absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Filters</p>
              <button
                type="button"
                className="hover:bg-muted inline-flex size-9 items-center justify-center rounded-lg"
                aria-label="Done"
                onClick={() => setFiltersOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            {filterForm}
            <button
              type="button"
              className="bg-primary text-primary-foreground mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-semibold"
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : null}

      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {q ? (
            <Chip label={`Search: ${q}`} onRemove={() => setQ("")} />
          ) : null}
          {type ? (
            <Chip
              label={MEDIA_TYPE_LABELS[type as MediaEntry["media_type"]]}
              onRemove={() => setType("")}
            />
          ) : null}
          {status ? (
            <Chip
              label={STATUS_LABELS[status as MediaEntry["status"]]}
              onRemove={() => setStatus("")}
            />
          ) : null}
          <button
            type="button"
            className="text-primary text-xs font-semibold hover:underline"
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyShelfIllustration
          title={
            hasFilters ? "No titles match these filters" : "Your shelf is empty"
          }
          description={
            hasFilters
              ? "Clear filters or add a new title."
              : "Add your first title to start reviewing."
          }
          primaryHref="/add/"
          primaryLabel={
            hasFilters ? "Add title" : "Add your first title"
          }
          secondaryHref="/dashboard/"
          secondaryLabel="Back to shelf"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      className={cn(
        "border-border bg-card inline-flex max-w-full items-center gap-1 rounded-full border py-1 pr-1 pl-2.5 text-xs",
      )}
    >
      <span className="truncate">{label}</span>
      <button
        type="button"
        className="hover:bg-muted inline-flex size-7 items-center justify-center rounded-full"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
      >
        <X className="size-3.5" />
      </button>
    </span>
  );
}
