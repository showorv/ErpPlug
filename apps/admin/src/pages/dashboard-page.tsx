import { ApiStatusBadge } from "@/features/system/api-status-badge";

export function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Platform dashboard</h1>
      <p className="max-w-prose text-slate-600">
        Operator console for tenants, plans, prices and payments. Screens arrive in Phase 1 (tenant
        list, suspend and restore) and Phase 2 (plan editor, manual payment confirmation).
      </p>
      <ApiStatusBadge />
    </section>
  );
}
