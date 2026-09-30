"use client";

import type { FormField } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

function spanClass(field: FormField): string {
  if (
    field.width === "full" ||
    field.type === "textarea" ||
    field.type === "checkbox" ||
    field.type === "section" ||
    field.type === "multiselect"
  ) {
    return "sm:col-span-2";
  }
  return "";
}

export function FormRenderer({
  fields,
  values,
  onChange,
  readOnly = false,
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
          if (field.type === "section") {
            return (
              <div key={field.id} className="sm:col-span-2 pt-2">
                <dt className="font-display text-lg text-ink">{field.label}</dt>
                {field.helpText ? (
                  <dd className="text-sm text-muted">{field.helpText}</dd>
                ) : null}
              </div>
            );
          }
          const raw = values?.[field.id];
          let display: string =
            raw === undefined || raw === "" ? "—" : String(raw);
          if (field.type === "currency") display = formatMoney(raw);
          if (field.type === "checkbox") display = raw ? "Yes" : "No";
          return (
            <div key={field.id} className={spanClass(field)}>
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
        if (field.type === "section") {
          return (
            <div
              key={field.id}
              className="sm:col-span-2 border-b border-line pb-2 pt-2"
            >
              <h3 className="font-display text-lg">{field.label}</h3>
              {field.helpText ? (
                <p className="text-sm text-muted">{field.helpText}</p>
              ) : null}
            </div>
          );
        }

        const current =
          values?.[field.id] ??
          (field.defaultValue !== undefined ? field.defaultValue : "");
        const shared = {
          id: field.id,
          name: field.id,
          required: field.required,
          placeholder: field.placeholder,
        };

        const selectedMulti = String(current ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        return (
          <div key={field.id} className={`field ${spanClass(field)}`}>
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
            ) : field.type === "multiselect" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {(field.options ?? []).map((opt) => {
                  const checked = selectedMulti.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name={`${field.id}[]`}
                        value={opt}
                        defaultChecked={nativeForm ? checked : undefined}
                        checked={nativeForm ? undefined : checked}
                        onChange={
                          nativeForm
                            ? undefined
                            : (e) => {
                                const next = e.target.checked
                                  ? [...selectedMulti, opt]
                                  : selectedMulti.filter((x) => x !== opt);
                                onChange?.(field.id, next.join(", "));
                              }
                        }
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
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
                  field.type === "currency" || field.type === "number"
                    ? "number"
                    : field.type === "phone"
                      ? "tel"
                      : field.type === "url"
                        ? "url"
                        : field.type === "email"
                          ? "email"
                          : field.type === "date"
                            ? "date"
                            : "text"
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
    if (field.type === "section") continue;
    if (field.type === "checkbox") {
      values[field.id] =
        formData.get(field.id) === "true" || formData.get(field.id) === "on";
      continue;
    }
    if (field.type === "multiselect") {
      const all = formData
        .getAll(`${field.id}[]`)
        .map(String)
        .filter(Boolean);
      values[field.id] = all.join(", ");
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

export function validateRequiredFields(
  fields: FormField[],
  values: Record<string, string | number | boolean>,
): string | null {
  for (const field of fields) {
    if (field.type === "section" || !field.required) continue;
    const v = values[field.id];
    if (v === undefined || v === "" || v === false) {
      return `Please complete: ${field.label}`;
    }
  }
  return null;
}
