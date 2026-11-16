import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderRoute } from "@/test/render";

function mockFetch(response: () => Promise<Response>) {
  const fetchMock = vi.fn(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("web app shell", () => {
  it("shows the home page and a connected API status", async () => {
    const fetchMock = mockFetch(async () =>
      Response.json({ status: "ok", service: "api", uptimeSeconds: 1, timestamp: "" }),
    );
    renderRoute("/");

    expect(screen.getByRole("heading", { name: "Welcome to ErpPlug" })).toBeInTheDocument();
    expect(await screen.findByText(/Connected/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/health", expect.anything());
  });

  it("shows the API as not reachable when the request fails", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });
    renderRoute("/");

    expect(await screen.findByText(/Not reachable/)).toBeInTheDocument();
  });

  it("shows a not-found page for unknown routes, inside the shell", async () => {
    mockFetch(async () => Response.json({}));
    renderRoute("/does-not-exist");

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
