import { useApiHealth } from "./use-api-health";

export function ApiStatusBadge() {
  const { isPending, isError } = useApiHealth();

  const [dot, label] = isPending
    ? ["bg-slate-400", "Checking…"]
    : isError
      ? ["bg-red-500", "Not reachable. Is the API running? (pnpm dev)"]
      : ["bg-emerald-500", "Connected"];

  return (
    <p className="inline-flex items-center gap-2 text-sm text-slate-600" role="status">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      <span>API status: {label}</span>
    </p>
  );
}
