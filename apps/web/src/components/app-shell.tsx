import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";

/**
 * Workspace layout. In Phase 1 the navigation is built from the bootstrap payload
 * (installed modules + permissions) instead of this fixed list.
 */
export function AppShell() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="text-lg font-semibold">{t("app.name")}</span>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }
            >
              {t("nav.home")}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
