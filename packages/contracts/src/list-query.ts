/**
 * Query-string conventions for every list endpoint (BRD 13): paging, sorting, filtering, search.
 *
 *   GET /api/v1/contacts/contacts?page=2&pageSize=50&sort=name,-createdAt
 *       &filter.status=active&filter.balance.gte=1000&filter.type.in=customer,supplier&q=rahim
 *
 * - `page`      1-based, default 1.
 * - `pageSize`  default 25, max 100.
 * - `sort`      comma-separated fields, `-` prefix for descending, at most 3.
 * - `filter.<field>=<value>`        equals.
 *   `filter.<field>.<op>=<value>`   other operators: ne, gt, gte, lt, lte, in, contains.
 *   `in` takes a comma-separated list, so `in` values cannot contain commas.
 * - `q`         free-text search, when the endpoint supports it.
 *
 * Filters are flat dotted keys rather than `filter[status]` because Express 5 no longer parses
 * nested query objects by default, and flat keys read the same in the browser address bar.
 *
 * Each endpoint declares what it accepts with {@link defineListQuery}; anything else is rejected
 * with `400 INVALID_QUERY` so typos like `pagesize=` never silently return the wrong data.
 * The same definition parses the browser URL, so a list page's state lives in its address.
 */
import type { ValidationIssue } from "./errors.js";
import { PAGINATION, type PageRequest } from "./pagination.js";

export type SortDirection = "asc" | "desc";

export interface SortField<F extends string = string> {
  field: F;
  direction: SortDirection;
}

export const FILTER_OPERATORS = ["eq", "ne", "gt", "gte", "lt", "lte", "in", "contains"] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export type FilterScalar = string | number | boolean;
export type FilterValue = FilterScalar | FilterScalar[];

export interface FilterCondition<F extends string = string> {
  field: F;
  op: FilterOperator;
  /** Parsed by the field's type: numbers are numbers, `in` is an array, dates stay ISO strings. */
  value: FilterValue;
}

export interface ListQuery<
  S extends string = string,
  F extends string = string,
> extends PageRequest {
  sort: SortField<S>[];
  filters: FilterCondition<F>[];
  q?: string;
}

/**
 * How a filterable field's value is read from the query string.
 * `id` is a UUID; `date` is `YYYY-MM-DD` or a full ISO 8601 timestamp.
 */
export type FilterFieldType = "string" | "number" | "date" | "boolean" | "enum" | "id";

export type FilterFieldSpec =
  | { type: Exclude<FilterFieldType, "enum">; ops?: readonly FilterOperator[] }
  | { type: "enum"; values: readonly string[]; ops?: readonly FilterOperator[] };

/** Operators each field type accepts unless the spec narrows them with `ops`. */
export const DEFAULT_FILTER_OPERATORS: Readonly<
  Record<FilterFieldType, readonly FilterOperator[]>
> = {
  string: ["eq", "ne", "contains", "in"],
  number: ["eq", "ne", "gt", "gte", "lt", "lte", "in"],
  date: ["eq", "gt", "gte", "lt", "lte"],
  boolean: ["eq"],
  enum: ["eq", "ne", "in"],
  id: ["eq", "ne", "in"],
};

export const LIST_QUERY_LIMITS = {
  maxSortFields: 3,
  maxInValues: 100,
  maxTextLength: 200,
  maxPage: 1_000_000,
} as const;

export interface ListQuerySpec<S extends string, F extends string> {
  /** Fields the client may sort by. */
  sortable: readonly S[];
  /** Fields the client may filter by, with their value types. */
  filterable?: { readonly [K in F]: FilterFieldSpec };
  /** Sort used when the request has none, e.g. `"-createdAt"`. */
  defaultSort?: string;
  /** Whether the endpoint accepts `q` (free-text search). */
  search?: boolean;
  /** Lower the 100-row cap for heavy rows. */
  maxPageSize?: number;
}

export type ParseResult<T> =
  { success: true; data: T } | { success: false; issues: ValidationIssue[] };

/** Raw query input: Express `req.query`, a `URLSearchParams`, or a plain object. */
export type RawQuery =
  URLSearchParams | Readonly<Record<string, string | readonly string[] | undefined | unknown>>;

export interface ParseOptions {
  /**
   * Skip parameters the definition does not know instead of rejecting them. Use it in the browser,
   * where the URL may carry other state (an open tab, a dialog). The API stays strict.
   */
  ignoreUnknown?: boolean;
}

export interface ListQueryDefinition<S extends string, F extends string> {
  readonly spec: Readonly<ListQuerySpec<S, F>>;
  /** The query a list starts with: page 1, default size and sort, no filters. */
  defaults(): ListQuery<S, F>;
  /** Validates and parses a raw query. Collects every problem instead of stopping at the first. */
  parse(raw: RawQuery, options?: ParseOptions): ParseResult<ListQuery<S, F>>;
  /** Writes a query back to URL parameters, leaving out values equal to the defaults. */
  toSearchParams(query: ListQuery<S, F>): URLSearchParams;
}

/** The parsed query type of a definition: `ListQueryOf<typeof contactListQuery>`. */
export type ListQueryOf<D> =
  D extends ListQueryDefinition<infer S, infer F> ? ListQuery<S, F> : never;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;
const POSITIVE_INT = /^[1-9]\d*$/;

/** `"name,-createdAt"` → `[{ field: "name", direction: "asc" }, { field: "createdAt", direction: "desc" }]`. No validation. */
export function parseSort(value: string): SortField[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part.startsWith("-")
        ? { field: part.slice(1), direction: "desc" as const }
        : { field: part, direction: "asc" as const },
    );
}

/** Inverse of {@link parseSort}. */
export function formatSort(sort: readonly SortField[]): string {
  return sort.map((s) => (s.direction === "desc" ? `-${s.field}` : s.field)).join(",");
}

/** The parameter name for one filter condition: `filter.status` or `filter.total.gte`. */
export function filterParamName(field: string, op: FilterOperator): string {
  return op === "eq" ? `filter.${field}` : `filter.${field}.${op}`;
}

/**
 * Declares what one list endpoint accepts. Define it once next to the endpoint's types in the
 * module's `contracts/` folder; the controller parses with it and the screen builds URLs with it.
 *
 *   export const contactListQuery = defineListQuery({
 *     sortable: ["name", "createdAt"],
 *     filterable: { status: { type: "enum", values: ["active", "archived"] } },
 *     defaultSort: "name",
 *     search: true,
 *   });
 */
export function defineListQuery<const S extends string, const F extends string = never>(
  spec: ListQuerySpec<S, F>,
): ListQueryDefinition<S, F> {
  const maxPageSize = Math.min(spec.maxPageSize ?? PAGINATION.maxPageSize, PAGINATION.maxPageSize);
  const filterable: Partial<Record<string, FilterFieldSpec>> = spec.filterable ?? {};
  const sortable = new Set<string>(spec.sortable);

  const defaultSort = spec.defaultSort ? parseSort(spec.defaultSort) : [];
  for (const s of defaultSort) {
    if (!sortable.has(s.field)) {
      throw new Error(`defaultSort uses "${s.field}", which is not in sortable.`);
    }
  }
  const defaultSortText = formatSort(defaultSort);
  const defaultPageSize = Math.min(PAGINATION.defaultPageSize, maxPageSize);

  const defaults = (): ListQuery<S, F> => ({
    page: PAGINATION.defaultPage,
    pageSize: defaultPageSize,
    sort: defaultSort.map((s) => ({ ...s })) as SortField<S>[],
    filters: [],
  });

  function parse(raw: RawQuery, options: ParseOptions = {}): ParseResult<ListQuery<S, F>> {
    const issues: ValidationIssue[] = [];
    const query = defaults();
    const add = (path: string, message: string) => issues.push({ path, message });

    for (const [key, values] of entries(raw)) {
      const known =
        key === "page" ||
        key === "pageSize" ||
        key === "sort" ||
        (key === "q" && spec.search === true) ||
        key.startsWith("filter.");
      if (!known) {
        if (!options.ignoreUnknown) add(key, "Unknown parameter.");
        continue;
      }
      if (values.length !== 1) {
        add(key, "Give this parameter only once.");
        continue;
      }
      const value = values[0] as string;

      if (key === "page") {
        const page = readPositiveInt(value);
        if (page === undefined || page > LIST_QUERY_LIMITS.maxPage) {
          add(key, "Must be a whole number of 1 or more.");
        } else query.page = page;
      } else if (key === "pageSize") {
        const size = readPositiveInt(value);
        if (size === undefined || size > maxPageSize) {
          add(key, `Must be a whole number from 1 to ${maxPageSize}.`);
        } else query.pageSize = size;
      } else if (key === "sort") {
        const sort = parseSort(value);
        const seen = new Set<string>();
        let ok = sort.length > 0;
        if (!ok) add(key, "Give at least one field to sort by.");
        if (sort.length > LIST_QUERY_LIMITS.maxSortFields) {
          add(key, `Sort by at most ${LIST_QUERY_LIMITS.maxSortFields} fields.`);
          ok = false;
        }
        for (const s of sort) {
          if (!sortable.has(s.field)) {
            add(key, `Cannot sort by "${s.field}". Allowed: ${list(spec.sortable)}.`);
            ok = false;
          } else if (seen.has(s.field)) {
            add(key, `"${s.field}" appears more than once.`);
            ok = false;
          }
          seen.add(s.field);
        }
        if (ok) query.sort = sort as SortField<S>[];
      } else if (key === "q") {
        const q = value.trim();
        if (q.length > LIST_QUERY_LIMITS.maxTextLength) {
          add(key, `Use at most ${LIST_QUERY_LIMITS.maxTextLength} characters.`);
        } else if (q) query.q = q;
      } else {
        const [, field = "", op = "eq", ...rest] = key.split(".");
        const fieldSpec = Object.hasOwn(filterable, field) ? filterable[field] : undefined;
        if (!fieldSpec) {
          if (!options.ignoreUnknown) {
            add(key, `Cannot filter by "${field}". Allowed: ${list(Object.keys(filterable))}.`);
          }
          continue;
        }
        const allowedOps = fieldSpec.ops ?? DEFAULT_FILTER_OPERATORS[fieldSpec.type];
        if (rest.length > 0 || !allowedOps.includes(op as FilterOperator)) {
          add(key, `Unknown filter operator. "${field}" accepts: ${list(allowedOps)}.`);
          continue;
        }
        const parsed = readFilterValue(fieldSpec, op as FilterOperator, value);
        if ("error" in parsed) add(key, parsed.error);
        else
          query.filters.push({ field: field as F, op: op as FilterOperator, value: parsed.value });
      }
    }

    return issues.length > 0 ? { success: false, issues } : { success: true, data: query };
  }

  function toSearchParams(query: ListQuery<S, F>): URLSearchParams {
    const params = new URLSearchParams();
    if (query.page !== PAGINATION.defaultPage) params.set("page", String(query.page));
    if (query.pageSize !== defaultPageSize) params.set("pageSize", String(query.pageSize));
    const sort = formatSort(query.sort);
    if (sort && sort !== defaultSortText) params.set("sort", sort);
    for (const f of query.filters) {
      const value = Array.isArray(f.value) ? f.value.join(",") : String(f.value);
      params.set(filterParamName(f.field, f.op), value);
    }
    if (query.q?.trim()) params.set("q", query.q.trim());
    return params;
  }

  return { spec, defaults, parse, toSearchParams };
}

function entries(raw: RawQuery): Array<[string, string[]]> {
  if (raw instanceof URLSearchParams) {
    const map = new Map<string, string[]>();
    raw.forEach((value, key) => map.set(key, [...(map.get(key) ?? []), value]));
    return [...map];
  }
  const out: Array<[string, string[]]> = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    const values = Array.isArray(value) ? value : [value];
    // Anything that is not a string (a nested object from a custom parser) cannot be valid.
    out.push([key, values.map((v) => (typeof v === "string" ? v : "\u0000"))]);
  }
  return out;
}

function readPositiveInt(value: string): number | undefined {
  return POSITIVE_INT.test(value) ? Number(value) : undefined;
}

function readFilterValue(
  spec: FilterFieldSpec,
  op: FilterOperator,
  value: string,
): { value: FilterValue } | { error: string } {
  if (op === "in") {
    const parts = value.split(",").map((p) => p.trim());
    if (parts.length > LIST_QUERY_LIMITS.maxInValues) {
      return { error: `Give at most ${LIST_QUERY_LIMITS.maxInValues} values.` };
    }
    const out: FilterScalar[] = [];
    for (const part of parts) {
      const one = readScalar(spec, part);
      if ("error" in one) return one;
      out.push(one.value);
    }
    return { value: out };
  }
  return readScalar(spec, value.trim());
}

function readScalar(
  spec: FilterFieldSpec,
  value: string,
): { value: FilterScalar } | { error: string } {
  if (value === "" || value.includes("\u0000")) return { error: "Give a value." };
  switch (spec.type) {
    case "string":
      return value.length > LIST_QUERY_LIMITS.maxTextLength
        ? { error: `Use at most ${LIST_QUERY_LIMITS.maxTextLength} characters.` }
        : { value };
    case "number":
      return DECIMAL.test(value)
        ? { value: Number(value) }
        : { error: `"${value}" is not a number.` };
    case "date":
      return ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))
        ? { value }
        : { error: `"${value}" is not a date. Use YYYY-MM-DD.` };
    case "boolean":
      return value === "true" || value === "false"
        ? { value: value === "true" }
        : { error: 'Use "true" or "false".' };
    case "enum":
      return spec.values.includes(value)
        ? { value }
        : { error: `"${value}" is not allowed. Use one of: ${list(spec.values)}.` };
    case "id":
      return UUID.test(value) ? { value } : { error: `"${value}" is not a valid ID.` };
  }
}

function list(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "none";
}
