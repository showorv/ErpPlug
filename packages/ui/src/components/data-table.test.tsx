import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { defineListQuery, type ListQuery, type PageMeta } from "@erpplug/contracts";
import {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  DataTableSelectFilter,
} from "./data-table";

interface Contact {
  id: string;
  name: string;
  balance: number;
}

const contactQuery = defineListQuery({
  sortable: ["name", "balance"],
  filterable: { status: { type: "enum", values: ["active", "archived"] } },
  search: true,
});
type Query = ListQuery<"name" | "balance", "status">;

const columns: DataTableColumn<Contact, "name" | "balance">[] = [
  { id: "name", header: "Name", cell: (c) => c.name, sortField: "name" },
  { id: "balance", header: "Balance", cell: (c) => c.balance, sortField: "balance", align: "end" },
  { id: "note", header: "Note", cell: () => "—" },
];

const rows: Contact[] = [
  { id: "1", name: "Rahim Traders", balance: 1200 },
  { id: "2", name: "Karim & Sons", balance: 50 },
];
const meta: PageMeta = { page: 1, pageSize: 25, totalItems: 61, totalPages: 3 };

type Props = DataTableProps<Contact, "name" | "balance", "status">;

function renderTable(overrides: Partial<Props> = {}) {
  const onQueryChange = vi.fn<(q: Query) => void>();
  const props: Props = {
    columns,
    getRowId: (c) => c.id,
    data: rows,
    meta,
    query: contactQuery.defaults(),
    onQueryChange,
    label: "Contacts",
    ...overrides,
  };
  render(<DataTable {...props} />);
  return { onQueryChange };
}

describe("DataTable", () => {
  it("renders the rows and the page summary", () => {
    renderTable();
    const table = screen.getByRole("table", { name: "Contacts" });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(screen.getByText("Rahim Traders")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–25 of 61")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("turns header clicks into server sort, cycling ascending then descending", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderTable();

    await user.click(screen.getByRole("button", { name: /Name/ }));
    expect(onQueryChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: [{ field: "name", direction: "asc" }], page: 1 }),
    );
    // "Note" has no sortField, so it is plain text, not a button.
    expect(screen.queryByRole("button", { name: /Note/ })).not.toBeInTheDocument();
  });

  it("marks the sorted column for screen readers", () => {
    renderTable({
      query: { ...contactQuery.defaults(), sort: [{ field: "balance", direction: "desc" }] },
    });
    expect(screen.getByRole("columnheader", { name: /Balance/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Note" })).not.toHaveAttribute("aria-sort");
  });

  it("asks for the next page and disables moving before the first", async () => {
    const user = userEvent.setup();
    const { onQueryChange } = renderTable();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    await user.click(screen.getByRole("button", { name: "Last page" }));
    expect(onQueryChange).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }));
  });

  it("shows skeleton rows during the first load", () => {
    renderTable({ data: undefined, meta: undefined, isLoading: true });
    expect(screen.getByRole("table").closest("[aria-busy]")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Rahim Traders")).not.toBeInTheDocument();
  });

  it("shows the error with its request id and a retry button", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderTable({
      data: undefined,
      error: { message: "The server could not be reached.", requestId: "req-123" },
      onRetry,
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("The server could not be reached.");
    expect(alert).toHaveTextContent("req-123");
    await user.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses the caller's empty state when nothing is filtered", () => {
    renderTable({
      data: [],
      meta: { ...meta, totalItems: 0, totalPages: 1 },
      emptyState: <p>No contacts yet</p>,
    });
    expect(screen.getByText("No contacts yet")).toBeInTheDocument();
  });

  it("offers to clear filters when filters leave the list empty", async () => {
    const user = userEvent.setup();
    const query: Query = {
      ...contactQuery.defaults(),
      q: "zzz",
      filters: [{ field: "status", op: "eq", value: "archived" }],
      page: 2,
    };
    const { onQueryChange } = renderTable({ data: [], query });
    expect(screen.getByText("No results match these filters.")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /Clear filters/ })[0]!);
    const next = onQueryChange.mock.lastCall?.[0];
    expect(next).toMatchObject({ filters: [], page: 1 });
    expect(next?.q).toBeUndefined();
  });

  it("searches after the user stops typing", () => {
    vi.useFakeTimers();
    try {
      const { onQueryChange } = renderTable({ search: true });
      const box = screen.getByRole("searchbox", { name: "Search" });
      fireEvent.change(box, { target: { value: "ra" } });
      act(() => vi.advanceTimersByTime(200));
      fireEvent.change(box, { target: { value: "rah" } });
      act(() => vi.advanceTimersByTime(299));
      expect(onQueryChange).not.toHaveBeenCalled();
      act(() => vi.advanceTimersByTime(1));
      expect(onQueryChange).toHaveBeenCalledTimes(1);
      expect(onQueryChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: "rah", page: 1 }),
      );
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("DataTableSelectFilter", () => {
  function Harness({ onChange }: { onChange: (q: Query) => void }) {
    const [query, setQuery] = useState<Query>(contactQuery.defaults());
    return (
      <DataTableSelectFilter
        query={query}
        onQueryChange={(q) => {
          setQuery(q);
          onChange(q);
        }}
        field="status"
        label="Status"
        options={[
          { value: "active", label: "Active" },
          { value: "archived", label: "Archived" },
        ]}
      />
    );
  }

  it("sets an eq filter and removes it again with All", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(q: Query) => void>();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "Archived" }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ filters: [{ field: "status", op: "eq", value: "archived" }] }),
    );

    await user.click(screen.getByRole("combobox", { name: "Status" }));
    await user.click(await screen.findByRole("option", { name: "All" }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ filters: [] }));
  });
});
