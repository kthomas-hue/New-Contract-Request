"use client";

import type { FormField } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

export function FormRenderer({
  fields,
  values,
  onChange,
  readOnly = false,
  /** When true, inputs are uncontrolled and use `name` for FormData submit */
  nativeForm = false,
}: {
  fields: FormField[];
  values?: Record<string, string | number | boolean>;
  onChange?: (id: string, value: string | number | boolean) => void;
  readOnly?: boolean;
  nativeForm?: boolean;
}) {
  if (readOnly) {
    return (
      <dl className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const raw = values?.[field.id];
          let display: string =
            raw === undefined || raw === "" ? "—" : String(raw);
          if (field.type === "currency") display = formatMoney(raw);
          if (field.type === "checkbox") display = raw ? "Yes" : "No";
          return (
            <div
              key={field.id}
              className={field.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {field.label}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-ink">{display}</dd>
            </div>
          );
        })}
      </dl>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const current = values?.[field.id];
        const shared = {
          id: field.id,
          name: field.id,
          required: field.required,
          placeholder: field.placeholder,
        };

        return (
          <div
            key={field.id}
            className={`field ${field.type === "textarea" || field.type === "checkbox" ? "sm:col-span-2" : ""}`}
          >
            <label htmlFor={field.id}>
              {field.label}
              {field.required ? <span className="text-accent"> *</span> : null}
            </label>
            {field.type === "textarea" ? (
              <textarea
                {...shared}
                {...(nativeForm
                  ? { defaultValue: String(current ?? "") }
                  : {
                      value: String(current ?? ""),
                      onChange: (e) => onChange?.(field.id, e.target.value),
                    })}
              />
            ) : field.type === "select" ? (
              <select
                {...shared}
                {...(nativeForm
                  ? { defaultValue: String(current ?? "") }
                  : {
                      value: String(current ?? ""),
                      onChange: (e) => onChange?.(field.id, e.target.value),
                    })}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
                <input
                  id={field.id}
                  name={field.id}
                  type="checkbox"
                  value="true"
                  className="h-4 w-4 rounded border-line"
                  {...(nativeForm
                    ? { defaultChecked: Boolean(current) }
                    : {
                        checked: Boolean(current),
                        onChange: (e) =>
                          onChange?.(field.id, e.target.checked),
                      })}
                />
                {field.helpText || "Yes"}
              </label>
            ) : (
              <input
                {...shared}
                type={
                  field.type === "currency"
                    ? "number"
                    : field.type === "email"
                      ? "email"
                      : field.type
                }
                {...(nativeForm
                  ? { defaultValue: String(current ?? "") }
                  : {
                      value: String(current ?? ""),
                      onChange: (e) =>
                        onChange?.(
                          field.id,
                          field.type === "number" || field.type === "currency"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                            : e.target.value,
                        ),
                    })}
              />
            )}
            {field.helpText && field.type !== "checkbox" ? (
              <span className="help">{field.helpText}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function formDataToValues(
  fields: FormField[],
  formData: FormData,
): Record<string, string | number | boolean> {
  const values: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    if (field.type === "checkbox") {
      values[field.id] = formData.get(field.id) === "true" || formData.get(field.id) === "on";
      continue;
    }
    const raw = formData.get(field.id);
    if (raw === null) continue;
    const str = String(raw);
    if (field.type === "number" || field.type === "currency") {
      values[field.id] = str === "" ? "" : Number(str);
    } else {
      values[field.id] = str;
    }
  }
  return values;
}
