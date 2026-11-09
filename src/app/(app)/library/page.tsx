"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listEntries } from "@/features/entries/data";
import { EntryCard } from "@/features/entries/entry-card";
import {
  ENTRY_STATUSES,
  MEDIA_TYPES,
  MEDIA_TYPE_LABELS,
  STATUS_LABELS,
  type MediaEntry,
} from "@/features/entries/schema";

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
        description={`${entries.length} title${entries.length === 1 ? "" : "s"}`}
        action={
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground hover:bg-primary/85 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
          >
            Add title
          </Link>
        }
      />

      <form
        className="border-border bg-card/40 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title…"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All types</option>
          {MEDIA_TYPES.map((t) => (
            <option key={t} value={t}>
              {MEDIA_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">All statuses</option>
          {ENTRY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as "updated" | "rating" | "title" | "year")
          }
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="updated">Recently updated</option>
          <option value="rating">Rating</option>
          <option value="title">Title</option>
          <option value="year">Year</option>
        </select>
        <Button type="submit" className="sm:col-span-2 sm:w-fit lg:col-span-4">
          Apply filters
        </Button>
      </form>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : entries.length === 0 ? (
        <div className="border-border rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No titles match. Add one or clear filters.
          </p>
          <Link
            href="/add/"
            className="bg-primary text-primary-foreground mt-4 inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium"
          >
            Add title
          </Link>
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
