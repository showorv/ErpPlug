import {
  defineListQuery,
  type ListQueryOf,
  paginate,
  type Paginated,
  pageToOffset,
} from "@erpplug/contracts";

/**
 * Made-up data for the UI kit page. It behaves like a real list endpoint (filter, search, sort,
 * paginate, latency, failures), so the data table is shown working against "a server" before the
 * real tenant list exists (Phase 1). Nothing here is used by real screens.
 */

export const TENANT_STATUSES = ["active", "trial", "suspended"] as const;
export type TenantStatus = (typeof TENANT_STATUSES)[number];

export interface DemoTenant {
  id: string;
  name: string;
  slug: string;
  plan: "Starter" | "Growth" | "Business";
  status: TenantStatus;
  users: number;
  createdAt: string;
}

export const demoTenantListQuery = defineListQuery({
  sortable: ["name", "users", "createdAt"],
  filterable: {
    status: { type: "enum", values: TENANT_STATUSES },
    plan: { type: "enum", values: ["Starter", "Growth", "Business"] },
  },
  defaultSort: "-createdAt",
  search: true,
});
export type DemoTenantQuery = ListQueryOf<typeof demoTenantListQuery>;

const NAMES = [
  "Rahim Traders",
  "Karim & Sons",
  "Padma Textiles",
  "Meghna Foods",
  "Sundarban Pharma",
  "Jamuna Electronics",
  "Teesta Agro",
  "Shapla Garments",
  "Buriganga Steel",
  "Surma Tea Estates",
  "Kornofuli Paper",
  "Rupsha Fisheries",
];
const PLANS: DemoTenant["plan"][] = ["Starter", "Growth", "Business"];

export const DEMO_TENANTS: DemoTenant[] = Array.from({ length: 87 }, (_, i) => {
  const base = NAMES[i % NAMES.length] ?? "Tenant";
  const branch = Math.floor(i / NAMES.length);
  const name = branch === 0 ? base : `${base} ${branch + 1}`;
  const day = new Date(Date.UTC(2026, 0, 1) + i * 3 * 86_400_000);
  return {
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    plan: PLANS[(i * 7) % 3] ?? "Starter",
    status: TENANT_STATUSES[i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0] ?? "active",
    users: ((i * 37) % 60) + 1,
    createdAt: day.toISOString(),
  };
});

/** Applies a ListQuery the way the API will: filter, search, sort, then one page. */
export function queryDemoTenants(query: DemoTenantQuery): Paginated<DemoTenant> {
  let rows = DEMO_TENANTS.filter((t) =>
    query.filters.every((f) => {
      const value = t[f.field];
      return Array.isArray(f.value)
        ? f.value.includes(value)
        : f.op === "ne"
          ? value !== f.value
          : value === f.value;
    }),
  );
  if (query.q) {
    const q = query.q.toLowerCase();
    rows = rows.filter((t) => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }
  rows = [...rows].sort((a, b) => {
    for (const s of query.sort) {
      const av = a[s.field];
      const bv = b[s.field];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      if (cmp !== 0) return s.direction === "desc" ? -cmp : cmp;
    }
    return 0;
  });
  const { skip, take } = pageToOffset(query);
  return paginate(rows.slice(skip, skip + take), rows.length, query);
}

/** queryDemoTenants with network latency, and an optional failure in the standard error shape. */
export async function fetchDemoTenants(
  query: DemoTenantQuery,
  options: { fail?: boolean; delayMs?: number } = {},
): Promise<Paginated<DemoTenant>> {
  await new Promise((resolve) => setTimeout(resolve, options.delayMs ?? 400));
  if (options.fail) {
    const error = new Error("The tenant list could not be loaded.") as Error & {
      requestId: string;
    };
    error.requestId = "demo-7f3a9c21";
    throw error;
  }
  return queryDemoTenants(query);
}
