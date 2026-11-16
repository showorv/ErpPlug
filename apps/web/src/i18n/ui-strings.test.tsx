import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataTablePagination } from "@erpplug/ui/components/data-table";
import i18n from "@/i18n";
import { TranslatedUiStrings } from "./ui-strings";

const meta = { page: 2, pageSize: 25, totalItems: 61, totalPages: 3 };
const noop = () => {};

describe("TranslatedUiStrings", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("gives the shared components their text from the translation files", () => {
    render(
      <TranslatedUiStrings>
        <DataTablePagination meta={meta} onPageChange={noop} onPageSizeChange={noop} />
      </TranslatedUiStrings>,
    );
    expect(screen.getByText("Showing 26–50 of 61")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeInTheDocument();
  });

  it("follows the active language, including its digits", async () => {
    // Stand-in for the real bn.json that arrives after the pilot.
    i18n.addResourceBundle("bn", "translation", {
      ui: { pageOf: "পৃষ্ঠা {{page}} / {{totalPages}}", nextPage: "পরের পৃষ্ঠা" },
    });
    await i18n.changeLanguage("bn");
    render(
      <TranslatedUiStrings>
        <DataTablePagination meta={meta} onPageChange={noop} onPageSizeChange={noop} />
      </TranslatedUiStrings>,
    );
    expect(screen.getByText("পৃষ্ঠা ২ / ৩")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "পরের পৃষ্ঠা" })).toBeInTheDocument();
  });
});
