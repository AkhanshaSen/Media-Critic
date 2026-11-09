import type { ReactNode } from "react";

import {
  ScreenBreadcrumb,
  type BreadcrumbItem,
} from "@/components/layout/screen-breadcrumb";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
};

export function PageHeader({
  title,
  description,
  action,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
      {breadcrumb?.length ? <ScreenBreadcrumb items={breadcrumb} /> : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
