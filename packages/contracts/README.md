# packages/contracts

Shared TypeScript types and conventions used by both NestJS and React: the standard error format,
pagination, sorting, filtering and search (BRD 13). Endpoint request/response types and the
bootstrap payload type are added here as they are built (contracts first).

- **Owner:** Showrov (conventions) · both (endpoint types, contracts-first)
- **Built in:** Phase 0, days 7-8
- **Package:** `@erpplug/contracts`, compiled ESM in `dist/` (the CommonJS API loads it with
  Node's `require(esm)`). `pnpm dev` and the CI tasks build it first; after editing it by hand
  outside `pnpm dev`, run `pnpm --filter @erpplug/contracts build`.

## Errors

Every error response has this body, and the same `x-request-id` header:

```json
{
  "error": {
    "status": 400,
    "code": "INVALID_QUERY",
    "message": "Some list parameters are not valid.",
    "details": [{ "path": "pageSize", "message": "Must be a whole number from 1 to 100." }],
    "requestId": "0b6c2f6e-...",
    "path": "/api/v1/contacts/contacts?pageSize=500",
    "timestamp": "2026-11-17T08:00:00.000Z"
  }
}
```

- Clients branch on `code`, never on `message`. Platform codes are `ERROR_CODES`; module codes
  start with the module key (`sales.QUOTATION_LOCKED`).
- `VALIDATION_FAILED` and `INVALID_QUERY` put a `ValidationIssue[]` in `details`.
- 5xx responses never include internal details; the log has them under the same request ID.

## Lists

```
GET /api/v1/contacts/contacts?page=2&pageSize=50&sort=name,-createdAt
    &filter.status=active&filter.balance.gte=1000&filter.type.in=customer,supplier&q=rahim
```

| Parameter             | Meaning                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `page`                | 1-based, default 1                                                 |
| `pageSize`            | default 25, max 100 (an endpoint may set a lower max)              |
| `sort`                | comma-separated fields, `-` for descending, at most 3              |
| `filter.<field>`      | equals                                                             |
| `filter.<field>.<op>` | `ne`, `gt`, `gte`, `lt`, `lte`, `in` (comma-separated), `contains` |
| `q`                   | free-text search, when the endpoint enables it                     |

Response: `{ "items": [...], "meta": { "page", "pageSize", "totalItems", "totalPages" } }`
(`Paginated<T>`). A page past the end returns `items: []` with the real totals.

Each endpoint declares what it accepts, in its module's `contracts/` folder:

```ts
export const contactListQuery = defineListQuery({
  sortable: ["name", "createdAt"],
  filterable: {
    status: { type: "enum", values: ["active", "archived"] },
    balance: { type: "number" },
  },
  defaultSort: "name",
  search: true,
});
export type ContactListQuery = ListQueryOf<typeof contactListQuery>;
```

- **API:** `@Query(new ListQueryPipe(contactListQuery)) query: ContactListQuery`. Anything not
  declared is rejected with `400 INVALID_QUERY`, so a typo never silently returns the wrong rows.
  Turn `query` into the database call with `pageToOffset(query)` and return `paginate(rows, total, query)`.
- **Screens:** `useListQueryState(contactListQuery)` from `@erpplug/ui` keeps the same query in the
  page URL, and `DataTable` edits it.

Filter field types: `string`, `number`, `date` (`YYYY-MM-DD` or ISO 8601), `boolean`, `enum`, `id`
(UUID). Each type has a default set of operators (`DEFAULT_FILTER_OPERATORS`); narrow it with `ops`.
