import { type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { UiStringsProvider, type UiStrings } from "@erpplug/ui/lib/strings";

/** Feeds the shared components' built-in text (table paging, empty/error states) from en.json/bn.json. */
export function TranslatedUiStrings({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const strings = useMemo<UiStrings>(
    () => ({
      loading: t("ui.loading"),
      errorTitle: t("ui.errorTitle"),
      retry: t("ui.retry"),
      requestId: t("ui.requestId"),
      noResults: t("ui.noResults"),
      noResultsFiltered: t("ui.noResultsFiltered"),
      clearFilters: t("ui.clearFilters"),
      search: t("ui.search"),
      rowsPerPage: t("ui.rowsPerPage"),
      showingRange: (from, to, total) =>
        t("ui.showingRange", {
          from: from.toLocaleString(i18n.language),
          to: to.toLocaleString(i18n.language),
          total: total.toLocaleString(i18n.language),
        }),
      pageOf: (page, totalPages) =>
        t("ui.pageOf", {
          page: page.toLocaleString(i18n.language),
          totalPages: totalPages.toLocaleString(i18n.language),
        }),
      firstPage: t("ui.firstPage"),
      previousPage: t("ui.previousPage"),
      nextPage: t("ui.nextPage"),
      lastPage: t("ui.lastPage"),
      sortedAscending: t("ui.sortedAscending"),
      sortedDescending: t("ui.sortedDescending"),
      notSorted: t("ui.notSorted"),
      all: t("ui.all"),
      required: t("ui.required"),
    }),
    [t, i18n.language],
  );
  return <UiStringsProvider strings={strings}>{children}</UiStringsProvider>;
}
