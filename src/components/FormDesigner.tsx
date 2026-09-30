"use client";

import { useState, useTransition } from "react";
import { nanoid } from "nanoid";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { saveFormFields } from "@/lib/actions";
import type { FieldType, FormField } from "@/lib/types";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export function FormDesigner({
  clientId,
  initialFields,
}: {
  clientId: string;
  initialFields: FormField[];
}) {
  const [fields, setFields] = useState(initialFields);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setSaved(false);
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      {
        id: nanoid(8),
        label: "New field",
        type: "text",
        required: false,
        placeholder: "",
      },
    ]);
    setSaved(false);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSaved(false);
  }

  function move(id: string, dir: -1 | 1) {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      const next = idx + dir;
      if (idx < 0 || next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(next, 0, item);
      return copy;
    });
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Request form</h2>
          <p className="text-sm text-muted">
            Design the fields requesters fill in for this client.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-secondary" onClick={addField}>
            <Plus className="h-4 w-4" /> Add field
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveFormFields(clientId, fields);
                setSaved(true);
              })
            }
          >
            {pending ? "Saving…" : saved ? "Saved" : "Save form"}
          </button>
        </div>
      </div>

      <div className="space-y-3 stagger">
        {fields.map((field) => (
          <div
            key={field.id}
            className="surface rounded-2xl p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted">
                <GripVertical className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Field
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={() => move(field.id, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={() => move(field.id, 1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-danger"
                  onClick={() => removeField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field">
                <label>Label</label>
                <input
                  value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Type</label>
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateField(field.id, { type: e.target.value as FieldType })
                  }
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Placeholder</label>
                <input
                  value={field.placeholder ?? ""}
                  onChange={(e) =>
                    updateField(field.id, { placeholder: e.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>Help text</label>
                <input
                  value={field.helpText ?? ""}
                  onChange={(e) =>
                    updateField(field.id, { helpText: e.target.value })
                  }
                />
              </div>
              {field.type === "select" ? (
                <div className="field sm:col-span-2">
                  <label>Options (comma separated)</label>
                  <input
                    value={(field.options ?? []).join(", ")}
                    onChange={(e) =>
                      updateField(field.id, {
                        options: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
              ) : null}
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(field.id, { required: e.target.checked })
                  }
                />
                Required
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
