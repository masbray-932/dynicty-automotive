import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  children: ReactNode;
  error?: string;
};

export function FormField({ label, htmlFor, children, error }: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const element = isValidElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children)
    ? children as ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>
    : null;
  const control = element
    ? cloneElement(element, {
        id: element.props.id ?? htmlFor,
        "aria-invalid": error ? true : element.props["aria-invalid"],
        "aria-describedby": [element.props["aria-describedby"], error ? errorId : null].filter(Boolean).join(" ") || undefined,
      })
    : children;
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-200" htmlFor={htmlFor}>
        {label}
      </label>
      {control}
      {error ? <p className="text-sm text-red-300" id={errorId} role="alert">{error}</p> : null}
    </div>
  );
}
