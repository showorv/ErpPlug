import { act, render } from "@testing-library/react";
import { createMemoryRouter, type Location, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { defineListQuery, type ListQuery } from "@erpplug/contracts";
import { useListQueryState } from "./use-list-query-state";

const definition = defineListQuery({
  sortable: ["name", "createdAt"],
  filterable: { status: { type: "enum", values: ["active", "archived"] } },
  defaultSort: "name",
  search: true,
});

function setup(initialUrl: string) {
  const state: {
    query?: ListQuery<"name" | "createdAt", "status">;
    setQuery?: (q: ListQuery<"name" | "createdAt", "status">) => void;
    location?: Location;
  } = {};

  function Probe() {
    const [query, setQuery] = useListQueryState(definition);
    state.query = query;
    state.setQuery = setQuery;
    state.location = useLocation();
    return null;
  }

  const router = createMemoryRouter([{ path: "/contacts", element: <Probe /> }], {
    initialEntries: [initialUrl],
  });
  render(<RouterProvider router={router} />);
  return state;
}

describe("useListQueryState", () => {
  it("reads the list query from the URL", () => {
    const state = setup("/contacts?page=2&sort=-createdAt&filter.status=active&q=rah&tab=notes");
    expect(state.query).toEqual({
      page: 2,
      pageSize: 25,
      sort: [{ field: "createdAt", direction: "desc" }],
      filters: [{ field: "status", op: "eq", value: "active" }],
      q: "rah",
    });
  });

  it("writes changes back to the URL and keeps unrelated parameters", () => {
    const state = setup("/contacts?page=3&tab=notes");
    act(() =>
      state.setQuery!({
        ...state.query!,
        page: 1,
        filters: [{ field: "status", op: "eq", value: "archived" }],
      }),
    );
    expect(state.location?.search).toBe("?tab=notes&filter.status=archived");
    expect(state.query?.filters).toEqual([{ field: "status", op: "eq", value: "archived" }]);
  });

  it("falls back to the defaults for a hand-edited, invalid URL", () => {
    const state = setup("/contacts?page=zero&sort=costPrice");
    expect(state.query).toEqual(definition.defaults());
  });
});
