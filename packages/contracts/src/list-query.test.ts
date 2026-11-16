import { describe, expect, it } from "vitest";
import { defineListQuery, formatSort, parseSort } from "./list-query.js";

const contacts = defineListQuery({
  sortable: ["name", "createdAt", "balance"],
  filterable: {
    status: { type: "enum", values: ["active", "archived"] },
    balance: { type: "number" },
    createdAt: { type: "date" },
    vip: { type: "boolean" },
    ownerId: { type: "id" },
    city: { type: "string" },
  },
  defaultSort: "-createdAt",
  search: true,
});

function parseOk(raw: Parameters<typeof contacts.parse>[0]) {
  const result = contacts.parse(raw);
  if (!result.success) throw new Error(JSON.stringify(result.issues));
  return result.data;
}

describe("defineListQuery: parse", () => {
  it("returns the defaults for an empty query", () => {
    expect(parseOk({})).toEqual({
      page: 1,
      pageSize: 25,
      sort: [{ field: "createdAt", direction: "desc" }],
      filters: [],
    });
  });

  it("parses paging, sorting, search and typed filters", () => {
    const query = parseOk({
      page: "3",
      pageSize: "50",
      sort: "name,-balance",
      q: "  rahim  ",
      "filter.status": "active",
      "filter.balance.gte": "1000.50",
      "filter.createdAt.lt": "2026-01-01",
      "filter.vip": "true",
      "filter.city.in": "Dhaka, Chattogram",
      "filter.ownerId": "0b6c2f6e-1a2b-4c3d-8e9f-0123456789ab",
    });

    expect(query).toEqual({
      page: 3,
      pageSize: 50,
      sort: [
        { field: "name", direction: "asc" },
        { field: "balance", direction: "desc" },
      ],
      q: "rahim",
      filters: [
        { field: "status", op: "eq", value: "active" },
        { field: "balance", op: "gte", value: 1000.5 },
        { field: "createdAt", op: "lt", value: "2026-01-01" },
        { field: "vip", op: "eq", value: true },
        { field: "city", op: "in", value: ["Dhaka", "Chattogram"] },
        { field: "ownerId", op: "eq", value: "0b6c2f6e-1a2b-4c3d-8e9f-0123456789ab" },
      ],
    });
  });

  it("reads URLSearchParams the same way as an Express query object", () => {
    const params = new URLSearchParams("page=2&sort=name&filter.status.in=active,archived");
    expect(parseOk(params)).toMatchObject({
      page: 2,
      sort: [{ field: "name", direction: "asc" }],
      filters: [{ field: "status", op: "in", value: ["active", "archived"] }],
    });
  });

  it("collects every problem with the parameter it belongs to", () => {
    const result = contacts.parse({
      page: "0",
      pageSize: "500",
      sort: "costPrice,name,name",
      pagesize: "10",
      "filter.status": "deleted",
      "filter.balance.gte": "lots",
      "filter.balance.between": "1,2",
      "filter.hidden": "x",
      "filter.vip": "yes",
      "filter.ownerId": "1",
      "filter.createdAt": "2026-13-45",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.issues.map((i) => i.path);
    expect(paths).toEqual([
      "page",
      "pageSize",
      "sort",
      "sort",
      "pagesize",
      "filter.status",
      "filter.balance.gte",
      "filter.balance.between",
      "filter.hidden",
      "filter.vip",
      "filter.ownerId",
      "filter.createdAt",
    ]);
    expect(result.issues[0]?.message).toBe("Must be a whole number of 1 or more.");
    expect(result.issues[2]?.message).toContain('Cannot sort by "costPrice"');
  });

  it("rejects a parameter given twice", () => {
    const result = contacts.parse({ page: ["1", "2"] });
    expect(result).toEqual({
      success: false,
      issues: [{ path: "page", message: "Give this parameter only once." }],
    });
  });

  it("rejects non-string values from a nested query parser", () => {
    const result = contacts.parse({ "filter.city": { $ne: "x" } });
    expect(result.success).toBe(false);
  });

  it("does not treat prototype keys as filterable fields", () => {
    const result = contacts.parse({ "filter.constructor": "x", "filter.__proto__": "y" });
    expect(result.success).toBe(false);
  });

  it("only accepts q when the endpoint enables search", () => {
    const noSearch = defineListQuery({ sortable: ["name"] });
    expect(noSearch.parse({ q: "x" }).success).toBe(false);
  });

  it("can ignore unknown parameters, for browser URLs that carry other state", () => {
    const result = contacts.parse(
      { tab: "notes", "filter.other": "1", page: "2" },
      { ignoreUnknown: true },
    );
    expect(result).toMatchObject({ success: true, data: { page: 2, filters: [] } });
  });

  it("respects a lower maxPageSize", () => {
    const heavy = defineListQuery({ sortable: ["name"], maxPageSize: 20 });
    expect(heavy.defaults().pageSize).toBe(20);
    expect(heavy.parse({ pageSize: "21" }).success).toBe(false);
  });

  it("throws at definition time when defaultSort uses a field that is not sortable", () => {
    expect(() => defineListQuery({ sortable: ["name"], defaultSort: "-createdAt" })).toThrow(
      /createdAt/,
    );
  });
});

describe("defineListQuery: toSearchParams", () => {
  it("leaves out values equal to the defaults", () => {
    expect(contacts.toSearchParams(contacts.defaults()).toString()).toBe("");
  });

  it("round-trips through parse", () => {
    const query = parseOk({
      page: "4",
      pageSize: "10",
      sort: "name",
      q: "karim",
      "filter.status.in": "active,archived",
      "filter.balance.lte": "50",
    });
    const params = contacts.toSearchParams(query);
    expect(params.toString()).toBe(
      "page=4&pageSize=10&sort=name&filter.status.in=active%2Carchived&filter.balance.lte=50&q=karim",
    );
    expect(parseOk(params)).toEqual(query);
  });
});

describe("parseSort / formatSort", () => {
  it("are inverses", () => {
    const sort = parseSort(" name , -createdAt ,");
    expect(sort).toEqual([
      { field: "name", direction: "asc" },
      { field: "createdAt", direction: "desc" },
    ]);
    expect(formatSort(sort)).toBe("name,-createdAt");
  });
});
