import { useApiHealth } from "./use-api-health";

export function ApiStatusBadge() {
  const { isPending, isError } = useApiHealth();

  const [dot, label] = isPending
    ? ["bg-muted-foreground", "Checking…"]
    : isError
      ? ["bg-red-500", "Not reachable. Is the API running? (pnpm dev)"]
      : ["bg-emerald-500", "Connected"];

  return (
    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      <span>API status: {label}</span>
    </p>
  );
}
