import { NavLink, Outlet } from "react-router";

const navItems = [{ to: "/", label: "Dashboard", end: true }];

/**
 * Operator console layout. Tenants, plans and payments screens are added in Phases 1 and 2.
 * Internal tool: English only, no translation files (the tenant workspace is the one translated).
 */
export function AppShell() {
  return (
    <div className="flex min-h-dvh">
      <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900 text-slate-100">
        <div className="px-4 py-4 text-lg font-semibold">ErpPlug Admin</div>
        <nav className="flex flex-col gap-1 px-2 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded px-2 py-1.5 ${isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
