import type { RouteObject } from "react-router";
import { AppShell } from "@/components/app-shell";
import { NotFoundPage, RouteErrorPage } from "@/pages/error-pages";
import { HomePage } from "@/pages/home-page";

/**
 * Route table. In Phase 1 each installed module contributes its routes from the bootstrap
 * payload and its screens are lazy-loaded (BRD 8.5).
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
