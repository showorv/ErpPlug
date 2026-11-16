import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderRoute } from "@/test/render";

describe("admin console shell", () => {
  it("shows the dashboard with the sidebar and a connected API status", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ status: "ok", service: "api", uptimeSeconds: 1, timestamp: "" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderRoute("/");

    expect(screen.getByRole("heading", { name: "Platform dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(await screen.findByText(/Connected/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.anything());
  });

  it("shows a not-found page for unknown routes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({})),
    );
    renderRoute("/tenants/missing");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
