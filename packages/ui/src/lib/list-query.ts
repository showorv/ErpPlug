import type {
  FilterCondition,
  FilterOperator,
  FilterValue,
  ListQuery,
  SortField,
} from "@erpplug/contracts";

/** Small immutable helpers for changing a ListQuery from UI controls. Any change resets to page 1. */

export function getFilter<S extends string, F extends string>(
  query: ListQuery<S, F>,
  field: F,
  op: FilterOperator = "eq",
): FilterValue | undefined {
  return query.filters.find((f) => f.field === field && f.op === op)?.value;
}

/** Sets or (with `undefined`, `""` or `[]`) removes one filter condition. */
export function setFilter<S extends string, F extends string>(
  query: ListQuery<S, F>,
  field: F,
  op: FilterOperator,
  value: FilterValue | undefined,
): ListQuery<S, F> {
  const rest = query.filters.filter((f) => !(f.field === field && f.op === op));
  const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  const filters: FilterCondition<F>[] = empty ? rest : [...rest, { field, op, value }];
  return { ...query, filters, page: 1 };
}

export function setSearch<S extends string, F extends string>(
  query: ListQuery<S, F>,
  q: string,
): ListQuery<S, F> {
  const trimmed = q.trim();
  const { q: _old, ...rest } = query;
  return trimmed ? { ...rest, q: trimmed, page: 1 } : { ...rest, page: 1 };
}

export function setSort<S extends string, F extends string>(
  query: ListQuery<S, F>,
  sort: SortField<S>[],
): ListQuery<S, F> {
  return { ...query, sort, page: 1 };
}

export function setPage<S extends string, F extends string>(
  query: ListQuery<S, F>,
  page: number,
): ListQuery<S, F> {
  return { ...query, page: Math.max(1, page) };
}

export function setPageSize<S extends string, F extends string>(
  query: ListQuery<S, F>,
  pageSize: number,
): ListQuery<S, F> {
  return { ...query, pageSize, page: 1 };
}

/** Removes every filter and the search text, keeping sort and page size. */
export function clearFilters<S extends string, F extends string>(
  query: ListQuery<S, F>,
): ListQuery<S, F> {
  const { q: _q, ...rest } = query;
  return { ...rest, filters: [], page: 1 };
}

export function hasActiveFilters(query: ListQuery): boolean {
  return query.filters.length > 0 || Boolean(query.q);
}
