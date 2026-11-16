/** Defaults and limits for every list endpoint. */
export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 25,
  maxPageSize: 100,
  /** Page sizes the UI offers in its "rows per page" menu. */
  pageSizeOptions: [10, 25, 50, 100],
} as const;

export interface PageRequest {
  /** 1-based page number. */
  page: number;
  pageSize: number;
}

export interface PageMeta extends PageRequest {
  /** Rows matching the filters across all pages. */
  totalItems: number;
  /** At least 1, so "page 1 of 1" still reads well for an empty list. */
  totalPages: number;
}

/**
 * Response body of every list endpoint:
 *   { "items": [...], "meta": { "page": 2, "pageSize": 25, "totalItems": 61, "totalPages": 3 } }
 * Asking for a page past the end returns `items: []` with the real totals, not an error.
 */
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Builds the list response from one page of rows and the total count. */
export function paginate<T>(items: T[], totalItems: number, page: PageRequest): Paginated<T> {
  return {
    items,
    meta: {
      page: page.page,
      pageSize: page.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / page.pageSize)),
    },
  };
}

/** Offset arguments for the database query (Prisma `skip` / `take`). */
export function pageToOffset(page: PageRequest): { skip: number; take: number } {
  return { skip: (page.page - 1) * page.pageSize, take: page.pageSize };
}
