import { useTranslation } from "react-i18next";
import { useApiHealth } from "./use-api-health";

export function ApiStatusBadge() {
  const { t } = useTranslation();
  const { isPending, isError } = useApiHealth();

  const [dot, label] = isPending
    ? ["bg-slate-400", t("system.checking")]
    : isError
      ? ["bg-red-500", t("system.down")]
      : ["bg-emerald-500", t("system.up")];

  return (
    <p className="inline-flex items-center gap-2 text-sm text-slate-600" role="status">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      <span>
        {t("system.apiStatus")}: {label}
      </span>
    </p>
  );
}
