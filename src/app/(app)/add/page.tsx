"use client";

import { DismissibleTip } from "@/components/layout/dismissible-tip";
import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/features/entries/entry-form";

export default function AddEntryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add to your shelf"
        description="Start with a title and optional poster — then rate, review, and track progress."
        breadcrumb={[
          { label: "Shelf", href: "/dashboard/" },
          { label: "Add title" },
        ]}
      />
      <div className="mx-auto w-full max-w-2xl">
        <DismissibleTip id="add-cover">
          Tip: a good cover makes your shelf feel alive. JPEG/PNG/WebP, up to 5
          MB.
        </DismissibleTip>
      </div>
      <EntryForm mode="create" />
    </div>
  );
}
