import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { createQueryClient } from "./app/query-client";
import { routes } from "./app/routes";
import "./i18n";
import { TranslatedUiStrings } from "./i18n/ui-strings";
import "./index.css";

const router = createBrowserRouter(routes);
const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TranslatedUiStrings>
        <RouterProvider router={router} />
      </TranslatedUiStrings>
    </QueryClientProvider>
  </StrictMode>,
);
