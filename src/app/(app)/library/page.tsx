"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import {
  ENTRY_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";

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
            className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold shadow-md shadow-amber-900/20"
          >
            Add title
          </Link>
        }
      />

      <form
        className="border-border bg-card/40 grid gap-3 rounded-2xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
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

      </form>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed p-10 text-center">
          <p className="text-lg font-semibold tracking-tight">
            {q || type || status
              ? "No titles match these filters"
              : "Your shelf is empty"}
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            {q || type || status
              ? "Clear filters or add a new title."
              : "Add your first title to start reviewing."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/add/"
              className="bg-amber-400 inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-amber-950 hover:bg-amber-300"
            >
              Add your first title
            </Link>
            <Link
              href="/dashboard/"
              className="border-border hover:bg-muted inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium"
            >
              Back to shelf
            </Link>
          </div>
        </div>
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
