"use client";

import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/features/entries/entry-form";

export default function AddEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add title"
        description="Log a title, rating, and review to your private shelf."
      />
      <EntryForm mode="create" />
    </div>
  );
}
