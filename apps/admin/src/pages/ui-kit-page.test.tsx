import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderRoute } from "@/test/render";

describe("UI kit page", () => {
  it("runs the data table against the demo server and keeps paging in the URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    const user = userEvent.setup();
    const { router } = renderRoute("/ui");

    expect(screen.getByRole("heading", { level: 1, name: "UI kit" })).toBeInTheDocument();
    expect(
      await screen.findByText("Showing 1–25 of 87", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Tenants" });
    expect(within(table).getAllByRole("row")).toHaveLength(26);

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(
      await screen.findByText("Showing 26–50 of 87", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(router.state.location.search).toBe("?page=2");
  });
});
