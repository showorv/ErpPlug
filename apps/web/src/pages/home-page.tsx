import { useTranslation } from "react-i18next";
import { ApiStatusBadge } from "@/features/system/api-status-badge";

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
      <p className="max-w-prose text-muted-foreground">{t("home.body")}</p>
      <ApiStatusBadge />
    </section>
  );
}
