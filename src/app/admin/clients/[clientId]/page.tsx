import Link from "next/link";
import { notFound } from "next/navigation";
import { FormDesigner } from "@/components/FormDesigner";
import { RoleDesigner } from "@/components/RoleDesigner";
import { WorkflowDesigner } from "@/components/WorkflowDesigner";
import { WorkflowPreview } from "@/components/WorkflowTimeline";
import { updateClientMeta } from "@/lib/actions";
import { readStore } from "@/lib/db";

export default async function ClientAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { clientId } = await params;
  const { tab = "workflow" } = await searchParams;
  const store = await readStore();
  const client = store.clients.find((c) => c.id === clientId);
  if (!client) notFound();

  const tabs = [
    { id: "workflow", label: "Workflow" },
    { id: "form", label: "Form" },
    { id: "roles", label: "Roles & people" },
    { id: "settings", label: "Settings" },
  ] as const;

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <Link href="/admin" className="text-sm font-semibold text-brand">
          ← All clients
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ background: client.accent }}
          />
          <h1 className="font-display text-3xl tracking-tight">{client.name}</h1>
        </div>
        <p className="mt-1 max-w-2xl text-muted">
          {client.description || "Configure this client’s form and workflow."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/clients/${client.id}?tab=${t.id}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? "bg-brand text-white"
                : "bg-white/80 text-ink-soft hover:bg-white"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "workflow" ? (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <WorkflowDesigner
            clientId={client.id}
            initialSteps={client.workflowSteps}
            roles={client.roles}
            users={store.users}
          />
          <aside className="surface h-fit rounded-[var(--radius)] p-5">
            <h3 className="font-display text-lg">Preview</h3>
            <p className="mb-4 text-sm text-muted">
              How requesters will see the path.
            </p>
            <WorkflowPreview steps={client.workflowSteps} />
          </aside>
        </div>
      ) : null}

      {tab === "form" ? (
        <FormDesigner clientId={client.id} initialFields={client.formFields} />
      ) : null}

      {tab === "roles" ? (
        <RoleDesigner
          clientId={client.id}
          initialRoles={client.roles}
          users={store.users}
        />
      ) : null}

      {tab === "settings" ? (
        <section className="surface rounded-[var(--radius)] p-5">
          <h2 className="font-display text-2xl">Client settings</h2>
          <form
            action={async (formData) => {
              "use server";
              await updateClientMeta(client.id, {
                name: String(formData.get("name") ?? ""),
                description: String(formData.get("description") ?? ""),
                accent: String(formData.get("accent") ?? client.accent),
              });
            }}
            className="mt-4 grid max-w-xl gap-3"
          >
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                defaultValue={client.name}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                defaultValue={client.description}
              />
            </div>
            <div className="field">
              <label htmlFor="accent">Accent</label>
              <input
                id="accent"
                name="accent"
                type="color"
                defaultValue={client.accent}
              />
            </div>
            <button type="submit" className="btn btn-primary justify-self-start">
              Save settings
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
