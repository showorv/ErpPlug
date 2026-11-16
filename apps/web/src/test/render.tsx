import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { routes } from "@/app/routes";
import { TranslatedUiStrings } from "@/i18n/ui-strings";

/** Renders the real route table at `path`, with a fresh query client that never retries. */
export function renderRoute(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <TranslatedUiStrings>
        <RouterProvider router={router} />
      </TranslatedUiStrings>
    </QueryClientProvider>,
  );
}
