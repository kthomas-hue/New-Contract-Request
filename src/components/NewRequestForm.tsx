"use client";

import { useMemo, useState, useTransition } from "react";
import { submitRequest } from "@/lib/actions";
import type { Client } from "@/lib/types";
import { FormRenderer } from "@/components/FormRenderer";
import { WorkflowPreview } from "@/components/WorkflowTimeline";

export function NewRequestForm({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId],
  );
  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    {},
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClientChange(id: string) {
    setClientId(id);
    setValues({});
    setError(null);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div className="surface rounded-[var(--radius)] p-6 animate-rise">
        <div className="field mb-5">
          <label htmlFor="client">Client</label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => onClientChange(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {client?.description ? (
            <span className="help">{client.description}</span>
          ) : null}
        </div>

        {client ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              for (const field of client.formFields) {
                if (field.required && (values[field.id] === undefined || values[field.id] === "")) {
                  setError(`Please complete: ${field.label}`);
                  return;
                }
              }
              startTransition(async () => {
                try {
                  await submitRequest({ clientId: client.id, formData: values });
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Failed to submit");
                }
              });
            }}
            className="space-y-5"
          >
            <FormRenderer
              fields={client.formFields}
              values={values}
              onChange={(id, value) =>
                setValues((prev) => ({ ...prev, [id]: value }))
              }
            />
            {error ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Submitting…" : "Submit request"}
            </button>
          </form>
        ) : (
          <p className="text-muted">No clients configured yet.</p>
        )}
      </div>

      <aside className="surface h-fit rounded-[var(--radius)] p-5 animate-rise">
        <h2 className="font-display text-xl">What happens next</h2>
        <p className="mt-1 text-sm text-muted">
          This client&apos;s workflow after you submit:
        </p>
        <div className="mt-4">
          {client ? <WorkflowPreview steps={client.workflowSteps} /> : null}
        </div>
      </aside>
    </div>
  );
}
