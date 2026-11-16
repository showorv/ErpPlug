import { NavLink, Outlet } from "react-router";
import { cn } from "@erpplug/ui/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/ui", label: "UI kit", end: false },
];

/**
 * Operator console layout. Tenants, plans and payments screens are added in Phases 1 and 2.
 * Internal tool: English only, no translation files (the tenant workspace is the one translated).
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <aside className="w-56 shrink-0 border-e border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-4 py-4 text-lg font-semibold">ErpPlug Admin</div>
        <nav className="flex flex-col gap-1 px-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-2 py-1.5",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
