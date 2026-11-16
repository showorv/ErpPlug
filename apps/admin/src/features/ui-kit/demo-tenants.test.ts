import { describe, expect, it } from "vitest";
import { DEMO_TENANTS, demoTenantListQuery, queryDemoTenants } from "./demo-tenants";

describe("demo tenant server", () => {
  it("filters, searches, sorts and pages like the API", () => {
    const query = {
      ...demoTenantListQuery.defaults(),
      pageSize: 5,
      sort: [{ field: "users" as const, direction: "desc" as const }],
      filters: [{ field: "status" as const, op: "eq" as const, value: "active" }],
      q: "traders",
    };
    const result = queryDemoTenants(query);
    const expected = DEMO_TENANTS.filter(
      (t) => t.status === "active" && t.name.toLowerCase().includes("traders"),
    );

    expect(result.meta).toEqual({
      page: 1,
      pageSize: 5,
      totalItems: expected.length,
      totalPages: Math.max(1, Math.ceil(expected.length / 5)),
    });
    expect(result.items.every((t) => t.status === "active")).toBe(true);
    const users = result.items.map((t) => t.users);
    expect(users).toEqual([...users].sort((a, b) => b - a));
  });
});
