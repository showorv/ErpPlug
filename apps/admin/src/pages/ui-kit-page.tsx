import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@erpplug/ui/components/badge";
import { Button } from "@erpplug/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@erpplug/ui/components/card";
import {
  DataTable,
  type DataTableColumn,
  DataTableSelectFilter,
} from "@erpplug/ui/components/data-table";
import {
  FormActions,
  FormField,
  FormGrid,
  FormLayout,
  FormSection,
} from "@erpplug/ui/components/form-layout";
import { Input } from "@erpplug/ui/components/input";
import { PageHeader } from "@erpplug/ui/components/page-header";
import { EmptyState, ErrorState, LoadingState } from "@erpplug/ui/components/page-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@erpplug/ui/components/select";
import { Textarea } from "@erpplug/ui/components/textarea";
import { useListQueryState } from "@erpplug/ui/hooks/use-list-query-state";
import {
  type DemoTenant,
  demoTenantListQuery,
  fetchDemoTenants,
  type TenantStatus,
} from "@/features/ui-kit/demo-tenants";

const statusVariant: Record<TenantStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  trial: "secondary",
  suspended: "destructive",
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

const columns: DataTableColumn<DemoTenant, "name" | "users" | "createdAt">[] = [
  {
    id: "name",
    header: "Tenant",
    sortField: "name",
    cell: (t) => (
      <div className="flex flex-col">
        <span className="font-medium">{t.name}</span>
        <span className="text-xs text-muted-foreground">{t.slug}</span>
      </div>
    ),
  },
  { id: "plan", header: "Plan", cell: (t) => t.plan },
  {
    id: "status",
    header: "Status",
    cell: (t) => (
      <Badge variant={statusVariant[t.status]} className="capitalize">
        {t.status}
      </Badge>
    ),
  },
  {
    id: "users",
    header: "Users",
    sortField: "users",
    align: "end",
    className: "w-24 tabular-nums",
    cell: (t) => t.users,
  },
  {
    id: "createdAt",
    header: "Created",
    sortField: "createdAt",
    className: "w-36",
    cell: (t) => dateFormat.format(new Date(t.createdAt)),
  },
];

/**
 * Living reference for packages/ui: every shared building block, wired the way real screens will
 * use them. Module screens should look like this page.
 */
export function UiKitPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Design system"
        title="UI kit"
        description="Shared components from packages/ui. The table below runs against a fake server with the same list conventions as the API."
        actions={
          <Button disabled>
            <PlusIcon data-icon="inline-start" />
            New tenant
          </Button>
        }
      />
      <TenantTableDemo />
      <FormDemo />
      <StatesDemo />
    </div>
  );
}

function TenantTableDemo() {
  const [query, setQuery] = useListQueryState(demoTenantListQuery);
  const [fail, setFail] = useState(false);
  const result = useQuery({
    queryKey: ["ui-kit", "tenants", query, fail],
    queryFn: () => fetchDemoTenants(query, { fail }),
    placeholderData: keepPreviousData,
    retry: false,
  });
  const error = result.error as (Error & { requestId?: string }) | null;

  return (
    <section aria-labelledby="ui-kit-table" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ui-kit-table" className="text-lg font-semibold">
          Data table
        </h2>
        <Button variant="outline" size="sm" onClick={() => setFail((f) => !f)}>
          {fail ? "Stop simulating errors" : "Simulate a server error"}
        </Button>
      </div>
      <DataTable
        label="Tenants"
        columns={columns}
        getRowId={(t) => t.id}
        data={result.data?.items}
        meta={result.data?.meta}
        query={query}
        onQueryChange={setQuery}
        isLoading={result.isPending}
        isFetching={result.isFetching}
        error={error ? { message: error.message, requestId: error.requestId } : null}
        onRetry={() => void result.refetch()}
        search
        searchPlaceholder="Search tenants"
        filters={
          <>
            <DataTableSelectFilter
              query={query}
              onQueryChange={setQuery}
              field="status"
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "trial", label: "Trial" },
                { value: "suspended", label: "Suspended" },
              ]}
            />
            <DataTableSelectFilter
              query={query}
              onQueryChange={setQuery}
              field="plan"
              label="Plan"
              options={[
                { value: "Starter", label: "Starter" },
                { value: "Growth", label: "Growth" },
                { value: "Business", label: "Business" },
              ]}
            />
          </>
        }
      />
    </section>
  );
}

function FormDemo() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section aria-labelledby="ui-kit-form" className="space-y-3">
      <h2 id="ui-kit-form" className="text-lg font-semibold">
        Form layout
      </h2>
      <Card>
        <CardContent>
          <FormLayout
            aria-labelledby="ui-kit-form"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <FormSection title="Business" description="Shown on invoices and receipts.">
              <FormGrid>
                <FormField
                  label="Business name"
                  required
                  error={submitted ? "Give the business name." : undefined}
                >
                  <Input name="name" autoComplete="organization" />
                </FormField>
                <FormField label="Workspace address" description="Letters, digits and dashes.">
                  <Input name="slug" placeholder="rahim-traders" />
                </FormField>
                <FormField label="Plan">
                  <Select defaultValue="Growth">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Phone">
                  <Input name="phone" type="tel" autoComplete="tel" />
                </FormField>
              </FormGrid>
            </FormSection>
            <FormSection title="Notes" description="Only operators see these.">
              <FormField label="Internal note" fullWidth>
                <Textarea name="note" rows={3} />
              </FormField>
            </FormSection>
            <FormActions>
              <Button type="button" variant="outline" onClick={() => setSubmitted(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </FormActions>
          </FormLayout>
        </CardContent>
      </Card>
    </section>
  );
}

function StatesDemo() {
  return (
    <section aria-labelledby="ui-kit-states" className="space-y-3">
      <h2 id="ui-kit-states" className="text-lg font-semibold">
        Page states
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No tenants yet"
              description="Tenants appear here after they sign up."
              action={<Button size="sm">Invite a tenant</Button>}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Loading</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingState />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorState
              description="The server could not be reached."
              requestId="0b6c2f6e-1a2b"
              onRetry={() => {}}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
