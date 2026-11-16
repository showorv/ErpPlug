import type { ReactNode } from "react";
import { cn } from "cn";
import { AlertCircleIcon, InboxIcon, Loader2Icon, RotateCwIcon } from "lucide-react";
import { Button } from "@erpplug/ui/components/button";
import { useUiStrings } from "@erpplug/ui/lib/strings";

interface StateFrameProps {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: "default" | "destructive";
  role?: "status" | "alert";
}

function StateFrame({
  icon,
  title,
  description,
  children,
  className,
  tone = "default",
  role,
}: StateFrameProps) {
  return (
    <div
      role={role}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "flex size-10 items-center justify-center rounded-full [&_svg]:size-5",
          tone === "destructive"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  /** Usually the button that creates the first record. */
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Shown when a list or section has nothing in it yet. */
export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <StateFrame
      icon={icon ?? <InboxIcon />}
      title={title}
      description={description}
      className={className}
    >
      {action}
    </StateFrame>
  );
}

export interface LoadingStateProps {
  /** Defaults to the "loading" UI string. */
  label?: ReactNode;
  className?: string;
}

/** Shown while a page or section loads for the first time. */
export function LoadingState({ label, className }: LoadingStateProps) {
  const strings = useUiStrings();
  return (
    <StateFrame
      role="status"
      icon={<Loader2Icon className="animate-spin" />}
      title={label ?? strings.loading}
      className={className}
    />
  );
}

export interface ErrorStateProps {
  /** Defaults to the "errorTitle" UI string. */
  title?: ReactNode;
  /** The error's message. API messages are written to be safe to show. */
  description?: ReactNode;
  /** The API's request ID, so a user can quote it to support. */
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}

/** Shown when loading failed. Offers a retry and shows the request ID for support. */
export function ErrorState({ title, description, requestId, onRetry, className }: ErrorStateProps) {
  const strings = useUiStrings();
  return (
    <StateFrame
      role="alert"
      tone="destructive"
      icon={<AlertCircleIcon />}
      title={title ?? strings.errorTitle}
      description={description}
      className={className}
    >
      {requestId ? (
        <p className="text-xs text-muted-foreground">
          {strings.requestId}: <code className="font-mono select-all">{requestId}</code>
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon data-icon="inline-start" />
          {strings.retry}
        </Button>
      ) : null}
    </StateFrame>
  );
}
