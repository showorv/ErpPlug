import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">{t("errors.notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("errors.notFoundBody")}</p>
      <Link to="/" className="text-sm font-medium text-foreground underline">
        {t("errors.backHome")}
      </Link>
    </section>
  );
}

/** Shown when a route throws while rendering or loading. */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />;

  return (
    <section className="mx-auto max-w-xl space-y-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t("errors.unexpectedTitle")}</h1>
      <a href="/" className="text-sm font-medium text-foreground underline">
        {t("errors.backHome")}
      </a>
    </section>
  );
}
