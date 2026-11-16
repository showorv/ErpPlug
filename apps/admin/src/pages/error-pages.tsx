import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function NotFoundPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link to="/" className="text-sm font-medium text-foreground underline">
        Back to dashboard
      </Link>
    </section>
  );
}

/** Shown when a route throws while rendering or loading. */
export function RouteErrorPage() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <section className="mx-auto max-w-xl space-y-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <a href="/" className="text-sm font-medium text-foreground underline">
        Back to dashboard
      </a>
    </section>
  );
}
