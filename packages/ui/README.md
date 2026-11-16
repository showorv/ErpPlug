# packages/ui

Design system: Tailwind CSS 4 + shadcn/ui, plus the shared components every module needs
(data table with pagination/sort/filter, form layout, page header, empty/loading/error states).

- **Owner:** Showrov
- **Built in:** Phase 0, days 7-8
- **Live reference:** the admin console's **UI kit** page, http://localhost:5174/ui

Shipped as TypeScript source: the Vite apps compile it directly, so there is no build step.

## Using it

```ts
// once per app, in src/index.css
@import "@erpplug/ui/globals.css";

// in components
import { Button } from "@erpplug/ui/components/button";
import { DataTable } from "@erpplug/ui/components/data-table";
import { useListQueryState } from "@erpplug/ui/hooks/use-list-query-state";
import { cn } from "@erpplug/ui/lib/utils";
```

| Import                                                                | What                                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `components/button`, `input`, `select`, `table`, `card`, `badge`, ... | shadcn/ui primitives (`radix-nova` style)                                      |
| `components/data-table`                                               | `DataTable`, `DataTableSearch`, `DataTableSelectFilter`, `DataTablePagination` |
| `components/form-layout`                                              | `FormLayout`, `FormSection`, `FormGrid`, `FormField`, `FormActions`            |
| `components/page-header`                                              | `PageHeader` (the page's single `h1` and its main actions)                     |
| `components/page-states`                                              | `EmptyState`, `LoadingState`, `ErrorState` (shows the request ID, retry)       |
| `hooks/use-list-query-state`                                          | list query <-> URL, using the endpoint's `defineListQuery` definition          |
| `lib/list-query`                                                      | `setFilter`, `setSearch`, `setSort`, `clearFilters`, ... (all reset to page 1) |
| `lib/strings`                                                         | `UiStringsProvider`: the built-in text (see below)                             |

## A list screen

```tsx
const [query, setQuery] = useListQueryState(contactListQuery);
const result = useQuery({
  queryKey: ["contacts", "list", query],
  queryFn: () => apiFetch<Paginated<Contact>>(`/v1/contacts/contacts?${contactListQuery.toSearchParams(query)}`),
  placeholderData: keepPreviousData,
});

<DataTable
  label={t("contacts.title")}
  columns={columns}             // { id, header, cell, sortField?, align? }
  getRowId={(c) => c.id}
  data={result.data?.items}
  meta={result.data?.meta}
  query={query}
  onQueryChange={setQuery}
  isLoading={result.isPending}
  isFetching={result.isFetching}
  error={result.error}
  onRetry={() => void result.refetch()}
  search
  filters={<DataTableSelectFilter query={query} onQueryChange={setQuery} field="status" ... />}
/>
```

The server does the paging, sorting, filtering and search; the table only shows one page and turns
clicks into a new query.

## Text and translation

The components contain no hardcoded language. Their built-in text (paging, "Clear filters", error
titles) comes from `UiStringsProvider`. `apps/web` fills it from its translation files
(`src/i18n/ui-strings.tsx`, keys under `ui.*`), so Bangla needs no change here; `apps/admin` uses
the English defaults. Everything else (column headers, labels, messages) is passed in by the screen.

## Adding shadcn/ui components

```bash
pnpm dlx shadcn@4.23.0 add dialog -c packages/ui
```

`components.json` points the CLI at this package. Generated files may be edited; keep their
`data-slot` attributes. Theme colours live in `src/styles/globals.css` only, never per screen.
