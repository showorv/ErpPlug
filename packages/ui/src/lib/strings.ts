import { createContext, createElement, type ReactNode, useContext } from "react";

/**
 * Every built-in piece of text the shared components show. The components never hardcode
 * language: the tenant workspace fills these from its translation files (so Bangla works the same
 * way), and the English-only admin console just uses the defaults.
 */
export interface UiStrings {
  loading: string;
  errorTitle: string;
  retry: string;
  /** Label before the request ID shown on errors, e.g. "Reference". */
  requestId: string;
  noResults: string;
  noResultsFiltered: string;
  clearFilters: string;
  search: string;
  rowsPerPage: string;
  /** "Showing 26–50 of 61". */
  showingRange: (from: number, to: number, total: number) => string;
  /** "Page 2 of 3". */
  pageOf: (page: number, totalPages: number) => string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
  /** Screen-reader text for a column sorted ascending / descending / not sorted. */
  sortedAscending: string;
  sortedDescending: string;
  notSorted: string;
  all: string;
  /** Marks a required form field for screen readers. */
  required: string;
}

export const defaultUiStrings: UiStrings = {
  loading: "Loading…",
  errorTitle: "Something went wrong",
  retry: "Try again",
  requestId: "Reference",
  noResults: "Nothing here yet.",
  noResultsFiltered: "No results match these filters.",
  clearFilters: "Clear filters",
  search: "Search",
  rowsPerPage: "Rows per page",
  showingRange: (from, to, total) => `Showing ${from}–${to} of ${total}`,
  pageOf: (page, totalPages) => `Page ${page} of ${totalPages}`,
  firstPage: "First page",
  previousPage: "Previous page",
  nextPage: "Next page",
  lastPage: "Last page",
  sortedAscending: "sorted ascending",
  sortedDescending: "sorted descending",
  notSorted: "not sorted",
  all: "All",
  required: "required",
};

const UiStringsContext = createContext<UiStrings>(defaultUiStrings);

export function UiStringsProvider({
  strings,
  children,
}: {
  strings: UiStrings;
  children: ReactNode;
}) {
  return createElement(UiStringsContext.Provider, { value: strings }, children);
}

export function useUiStrings(): UiStrings {
  return useContext(UiStringsContext);
}
