import type { ReactNode } from "react";
import { cn } from "cn";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons on the right, e.g. "New contact". They wrap below the title on narrow screens. */
  actions?: ReactNode;
  /** Small line above the title, e.g. breadcrumbs or a back link. */
  eyebrow?: ReactNode;
  className?: string;
}

/** The top of every screen: one h1, an optional description and the screen's main actions. */
export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6", className)}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? <div className="text-sm text-muted-foreground">{eyebrow}</div> : null}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
