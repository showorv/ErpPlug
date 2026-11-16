import {
  cloneElement,
  type ComponentProps,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";
import { cn } from "cn";
import { useUiStrings } from "@erpplug/ui/lib/strings";

/**
 * Form layout used by every create/edit screen:
 *
 *   <FormLayout onSubmit={...}>
 *     <FormSection title="Basics" description="Shown on invoices.">
 *       <FormGrid>
 *         <FormField label="Name" required error={errors.name}><Input /></FormField>
 *         <FormField label="Phone"><Input type="tel" /></FormField>
 *       </FormGrid>
 *     </FormSection>
 *     <FormActions><Button type="submit">Save</Button></FormActions>
 *   </FormLayout>
 */
export function FormLayout({ className, ...props }: ComponentProps<"form">) {
  return (
    <form
      data-slot="form-layout"
      noValidate
      className={cn("flex max-w-5xl flex-col gap-8", className)}
      {...props}
    />
  );
}

export interface FormSectionProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A titled group of fields. Title on the left on wide screens, above the fields on narrow ones. */
export function FormSection({ title, description, children, className }: FormSectionProps) {
  const headingId = useId();
  return (
    <section
      data-slot="form-section"
      aria-labelledby={headingId}
      className={cn(
        "grid gap-x-10 gap-y-4 border-b pb-8 last-of-type:border-b-0 md:grid-cols-[minmax(0,16rem)_1fr]",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 id={headingId} className="font-heading text-base font-semibold">
          {title}
        </h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

/** Lays fields out in columns: one on phones, `columns` (default 2) from tablet width up. */
export function FormGrid({
  columns = 2,
  className,
  ...props
}: ComponentProps<"div"> & { columns?: 1 | 2 | 3 }) {
  return (
    <div
      data-slot="form-grid"
      className={cn(
        "grid grid-cols-1 gap-x-4 gap-y-5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}

type ControlProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
};

export interface FormFieldProps {
  label: ReactNode;
  /** One form control (Input, Textarea, Select trigger...). It receives id and aria-* props. */
  children: ReactElement<ControlProps>;
  description?: ReactNode;
  /** Error message for this field; marks the control invalid and announces the message. */
  error?: ReactNode;
  required?: boolean;
  /** Span every column of a FormGrid. */
  fullWidth?: boolean;
  className?: string;
}

/**
 * Label + control + help text + error, wired together for screen readers: the label points at the
 * control, and the description and error are read out when the control gets focus.
 */
export function FormField({
  label,
  children,
  description,
  error,
  required,
  fullWidth,
  className,
}: FormFieldProps) {
  const strings = useUiStrings();
  const autoId = useId();
  const controlId = (isValidElement(children) && children.props.id) || autoId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const control = cloneElement(children, {
    id: controlId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    "aria-required": required || undefined,
  });

  return (
    <div
      data-slot="form-field"
      data-invalid={error ? true : undefined}
      className={cn("flex flex-col gap-2", fullWidth && "sm:col-span-full", className)}
    >
      <label
        htmlFor={controlId}
        className="text-sm leading-none font-medium group-data-[disabled=true]:opacity-50"
      >
        {label}
        {required ? (
          <>
            <span aria-hidden className="ms-0.5 text-destructive">
              *
            </span>
            <span className="sr-only"> ({strings.required})</span>
          </>
        ) : null}
      </label>
      {control}
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** The row of form buttons. Sticks to the bottom of the screen on long forms. */
export function FormActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="form-actions"
      className={cn(
        "sticky bottom-0 -mx-1 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-1 py-4 backdrop-blur supports-backdrop-filter:bg-background/80",
        className,
      )}
      {...props}
    />
  );
}
