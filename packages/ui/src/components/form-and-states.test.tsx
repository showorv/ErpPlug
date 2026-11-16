import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { defaultUiStrings, UiStringsProvider } from "@erpplug/ui/lib/strings";
import { FormActions, FormField, FormGrid, FormLayout, FormSection } from "./form-layout";
import { Input } from "./input";
import { PageHeader } from "./page-header";
import { EmptyState, ErrorState, LoadingState } from "./page-states";

describe("FormField", () => {
  it("connects the label, help text and error to the control", () => {
    render(
      <FormLayout aria-label="Contact">
        <FormSection title="Basics">
          <FormGrid>
            <FormField
              label="Name"
              required
              description="As printed on invoices."
              error="Give a name."
            >
              <Input />
            </FormField>
            <FormField label="Phone">
              <Input id="phone" type="tel" />
            </FormField>
          </FormGrid>
        </FormSection>
        <FormActions>
          <button type="submit">Save</button>
        </FormActions>
      </FormLayout>,
    );

    const name = screen.getByLabelText(/Name/);
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAttribute("aria-required", "true");
    expect(name).toHaveAccessibleDescription("As printed on invoices. Give a name.");
    expect(screen.getByRole("alert")).toHaveTextContent("Give a name.");

    // A control's own id is kept.
    expect(screen.getByLabelText("Phone")).toHaveAttribute("id", "phone");
    expect(screen.getByLabelText("Phone")).not.toHaveAttribute("aria-invalid");

    expect(screen.getByRole("region", { name: "Basics" })).toBeInTheDocument();
  });
});

describe("page building blocks", () => {
  it("renders the page header as the page's h1 with its actions", () => {
    render(
      <PageHeader
        title="Contacts"
        description="People you sell to."
        actions={<button>New</button>}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Contacts" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });

  it("announces loading and shows empty states", () => {
    render(
      <>
        <LoadingState />
        <EmptyState title="No invoices yet" action={<button>Create invoice</button>} />
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    expect(screen.getByText("No invoices yet")).toBeInTheDocument();
  });

  it("uses the strings the app provides, so the workspace can translate them", () => {
    render(
      <UiStringsProvider
        strings={{ ...defaultUiStrings, errorTitle: "কিছু ভুল হয়েছে", retry: "আবার চেষ্টা" }}
      >
        <ErrorState onRetry={() => {}} />
      </UiStringsProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("কিছু ভুল হয়েছে");
    expect(screen.getByRole("button", { name: "আবার চেষ্টা" })).toBeInTheDocument();
  });
});
