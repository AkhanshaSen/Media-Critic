"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/features/entries/entry-form";

export default function AddEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add title"
        description="Start with a cover poster and title — then rate, review, and track progress."
      />
      <div className="border-primary/20 from-primary/10 rounded-2xl border bg-gradient-to-r to-transparent px-4 py-3 text-sm">
        Tip: a good cover makes your shelf feel alive. JPEG/PNG/WebP, up to 5 MB.
      </div>
      <EntryForm mode="create" />
    </div>
  );
}
