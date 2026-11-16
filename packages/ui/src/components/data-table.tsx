import { type ReactNode, useEffect, useEffectEvent, useId, useMemo, useState } from "react";
import { cn } from "cn";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import {
  type ColumnDef,
  type RowData,
  rowSortingFeature,
  type SortingState,
  tableFeatures,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import { type ListQuery, type PageMeta, PAGINATION, type SortField } from "@erpplug/contracts";
import { Button } from "@erpplug/ui/components/button";
import { Input } from "@erpplug/ui/components/input";
import { EmptyState, ErrorState } from "@erpplug/ui/components/page-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@erpplug/ui/components/select";
import { Skeleton } from "@erpplug/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@erpplug/ui/components/table";
import {
  clearFilters,
  getFilter,
  hasActiveFilters,
  setFilter,
  setPage,
  setPageSize,
  setSearch,
  setSort,
} from "@erpplug/ui/lib/list-query";
import { useUiStrings } from "@erpplug/ui/lib/strings";

/**
 * Server-driven data table for every list screen. The server pages, sorts, filters and searches;
 * the table shows one page and turns clicks into a new ListQuery (from @erpplug/contracts).
 * Keep the query in the URL with useListQueryState so lists survive reloads and can be shared.
 *
 *   const [query, setQuery] = useListQueryState(contactListQuery);
 *   const result = useQuery({ queryKey: ["contacts", query], queryFn: ..., placeholderData: keepPreviousData });
 *   <DataTable columns={columns} getRowId={(c) => c.id} query={query} onQueryChange={setQuery}
 *     data={result.data?.items} meta={result.data?.meta} isLoading={result.isPending}
 *     error={result.error} onRetry={result.refetch} search />
 */

export interface DataTableColumn<TData, S extends string = string> {
  id: string;
  header: ReactNode;
  cell: (row: TData) => ReactNode;
  /** The server sort field for this column. Makes the header a sort button. */
  sortField?: S;
  align?: "start" | "end" | "center";
  /** Classes for both the header and the cells, e.g. a width. */
  className?: string;
}

export interface DataTableError {
  message: string;
  requestId?: string;
}

export interface DataTableProps<TData extends RowData, S extends string, F extends string> {
  columns: readonly DataTableColumn<TData, S>[];
  getRowId: (row: TData) => string;
  /** The current page of rows; `undefined` until the first load finishes. */
  data: readonly TData[] | undefined;
  meta: PageMeta | undefined;
  query: ListQuery<S, F>;
  onQueryChange: (query: ListQuery<S, F>) => void;
  /** First load in progress (no rows to show yet). */
  isLoading?: boolean;
  /** A refetch is in progress while older rows are still shown. */
  isFetching?: boolean;
  error?: DataTableError | null;
  onRetry?: () => void;
  /** Show the search box (the endpoint must accept `q`). */
  search?: boolean;
  searchPlaceholder?: string;
  /** Filter controls shown next to the search box, e.g. DataTableSelectFilter. */
  filters?: ReactNode;
  /** Shown when the list is empty and no filters are active, e.g. a "create the first one" prompt. */
  emptyState?: ReactNode;
  /** Accessible name of the table. */
  label?: string;
  className?: string;
}

const features = tableFeatures({ rowSortingFeature });
const alignClass = { start: "text-start", end: "text-end", center: "text-center" } as const;

export function DataTable<TData extends RowData, S extends string, F extends string>({
  columns,
  getRowId,
  data,
  meta,
  query,
  onQueryChange,
  isLoading,
  isFetching,
  error,
  onRetry,
  search,
  searchPlaceholder,
  filters,
  emptyState,
  label,
  className,
}: DataTableProps<TData, S, F>) {
  const strings = useUiStrings();

  const tableColumns = useMemo<ColumnDef<typeof features, TData>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        // Sorting needs an accessor; the value is unused because the server sorts.
        ...(col.sortField ? { accessorFn: () => null } : {}),
        enableSorting: Boolean(col.sortField),
        header: () => col.header,
        cell: ({ row }) => col.cell(row.original),
      })),
    [columns],
  );

  const sorting = useMemo<SortingState>(
    () =>
      query.sort.flatMap((s) => {
        const col = columns.find((c) => c.sortField === s.field);
        return col ? [{ id: col.id, desc: s.direction === "desc" }] : [];
      }),
    [columns, query.sort],
  );

  const onSortingChange = (updater: Updater<SortingState>) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next.flatMap((s): SortField<S>[] => {
      const field = columns.find((c) => c.id === s.id)?.sortField;
      return field ? [{ field, direction: s.desc ? "desc" : "asc" }] : [];
    });
    onQueryChange(setSort(query, sort));
  };

  const rows = useMemo(() => (data ? [...data] : []), [data]);
  const table = useTable({
    features,
    columns: tableColumns,
    data: rows,
    getRowId: (row) => getRowId(row),
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    sortDescFirst: false,
    enableMultiSort: true,
    maxMultiSortColCount: 3,
  });

  const colCount = columns.length;
  const filtered = hasActiveFilters(query);
  const showToolbar = search || filters || filtered;

  let body: ReactNode;
  if (error) {
    body = (
      <FullRow colSpan={colCount}>
        <ErrorState description={error.message} requestId={error.requestId} onRetry={onRetry} />
      </FullRow>
    );
  } else if (isLoading && !data) {
    body = Array.from({ length: Math.min(query.pageSize, 10) }, (_, i) => (
      <TableRow key={`loading-${i}`} aria-hidden>
        {columns.map((col) => (
          <TableCell key={col.id} className={col.className}>
            <Skeleton className="h-4 w-full max-w-40" />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (rows.length === 0) {
    body = (
      <FullRow colSpan={colCount}>
        {filtered ? (
          <EmptyState
            title={strings.noResultsFiltered}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQueryChange(clearFilters(query))}
              >
                {strings.clearFilters}
              </Button>
            }
          />
        ) : (
          (emptyState ?? <EmptyState title={strings.noResults} />)
        )}
      </FullRow>
    );
  } else {
    body = table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getAllCells().map((cell, i) => {
          const col = columns[i];
          return (
            <TableCell
              key={cell.id}
              className={cn(alignClass[col?.align ?? "start"], col?.className)}
            >
              <table.FlexRender cell={cell} />
            </TableCell>
          );
        })}
      </TableRow>
    ));
  }

  return (
    <div data-slot="data-table" className={cn("flex flex-col gap-3", className)}>
      {showToolbar ? (
        <div className="flex flex-wrap items-center gap-2">
          {search ? (
            <DataTableSearch
              value={query.q ?? ""}
              placeholder={searchPlaceholder}
              onSearch={(q) => onQueryChange(setSearch(query, q))}
            />
          ) : null}
          {filters}
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={() => onQueryChange(clearFilters(query))}>
              <XIcon data-icon="inline-start" />
              {strings.clearFilters}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-lg border transition-opacity",
          isFetching && data && "opacity-60",
        )}
        aria-busy={isLoading || isFetching || undefined}
      >
        <Table aria-label={label}>
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header, i) => {
                  const col = columns[i];
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(alignClass[col?.align ?? "start"], col?.className)}
                      aria-sort={
                        canSort
                          ? sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                    >
                      {canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("-mx-2.5", col?.align === "end" && "flex-row-reverse")}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUpIcon aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDownIcon aria-hidden />
                          ) : (
                            <ArrowUpDownIcon aria-hidden className="opacity-40" />
                          )}
                          <span className="sr-only">
                            {", "}
                            {sorted === "asc"
                              ? strings.sortedAscending
                              : sorted === "desc"
                                ? strings.sortedDescending
                                : strings.notSorted}
                          </span>
                        </Button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>

      {meta && !error ? (
        <DataTablePagination
          meta={meta}
          onPageChange={(page) => onQueryChange(setPage(query, page))}
          onPageSizeChange={(size) => onQueryChange(setPageSize(query, size))}
        />
      ) : null}
    </div>
  );
}

function FullRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0 whitespace-normal">
        {children}
      </TableCell>
    </TableRow>
  );
}

export interface DataTableSearchProps {
  value: string;
  onSearch: (q: string) => void;
  placeholder?: string;
  /** Wait this long after the last keystroke before searching. */
  debounceMs?: number;
}

/** Search box that waits for the user to stop typing before it changes the query. */
export function DataTableSearch({
  value,
  onSearch,
  placeholder,
  debounceMs = 300,
}: DataTableSearchProps) {
  const strings = useUiStrings();
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // The query changed from outside (e.g. "Clear filters"): show the new value.
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  const search = useEffectEvent((q: string) => onSearch(q));
  useEffect(() => {
    if (text.trim() === value) return;
    const timer = setTimeout(() => search(text), debounceMs);
    return () => clearTimeout(timer);
  }, [text, value, debounceMs]);

  return (
    <div className="relative w-full sm:w-72">
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        aria-label={strings.search}
        placeholder={placeholder ?? strings.search}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSearch(text);
        }}
        className="ps-8"
      />
    </div>
  );
}

export interface DataTableSelectFilterProps<S extends string, F extends string> {
  query: ListQuery<S, F>;
  onQueryChange: (query: ListQuery<S, F>) => void;
  /** Filterable field (an `eq` filter). */
  field: F;
  label: string;
  options: readonly { value: string; label: ReactNode }[];
}

const ALL = "__all__";

/** A dropdown that filters one enum field, with an "All" choice that removes the filter. */
export function DataTableSelectFilter<S extends string, F extends string>({
  query,
  onQueryChange,
  field,
  label,
  options,
}: DataTableSelectFilterProps<S, F>) {
  const strings = useUiStrings();
  const current = getFilter(query, field, "eq");
  const value = typeof current === "string" ? current : ALL;
  return (
    <Select
      value={value}
      onValueChange={(v) => onQueryChange(setFilter(query, field, "eq", v === ALL ? undefined : v))}
    >
      <SelectTrigger aria-label={label} className="w-auto min-w-36">
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{strings.all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export interface DataTablePaginationProps {
  meta: PageMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
}

export function DataTablePagination({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGINATION.pageSizeOptions,
}: DataTablePaginationProps) {
  const strings = useUiStrings();
  const rowsPerPageId = useId();
  const { page, pageSize, totalItems, totalPages } = meta;
  const from = totalItems === 0 ? 0 : Math.min((page - 1) * pageSize + 1, totalItems);
  const to = Math.min(page * pageSize, totalItems);
  const sizes = pageSizeOptions.includes(pageSize)
    ? pageSizeOptions
    : [...pageSizeOptions, pageSize].sort((a, b) => a - b);

  return (
    <nav
      aria-label={strings.pageOf(page, totalPages)}
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-sm"
    >
      <p className="text-muted-foreground" aria-live="polite">
        {totalItems > 0 ? strings.showingRange(from, to, totalItems) : null}
      </p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground" id={rowsPerPageId}>
            {strings.rowsPerPage}
          </span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger size="sm" aria-labelledby={rowsPerPageId} className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="tabular-nums">{strings.pageOf(page, totalPages)}</span>
        <div className="flex items-center gap-1">
          <PageButton
            label={strings.firstPage}
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeftIcon className="rtl:rotate-180" />
          </PageButton>
          <PageButton
            label={strings.previousPage}
            disabled={page <= 1}
            onClick={() => onPageChange(Math.min(page - 1, totalPages))}
          >
            <ChevronLeftIcon className="rtl:rotate-180" />
          </PageButton>
          <PageButton
            label={strings.nextPage}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon className="rtl:rotate-180" />
          </PageButton>
          <PageButton
            label={strings.lastPage}
            disabled={page >= totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            <ChevronsRightIcon className="rtl:rotate-180" />
          </PageButton>
        </div>
      </div>
    </nav>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
