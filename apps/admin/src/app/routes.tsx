import type { RouteObject } from "react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
import { NotFoundPage, RouteErrorPage } from "@/pages/error-pages";
import { UiKitPage } from "@/pages/ui-kit-page";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "ui", element: <UiKitPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];
