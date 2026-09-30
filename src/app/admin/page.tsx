import Link from "next/link";
import { Copy, Plus, Workflow } from "lucide-react";
import { CLIENT_TEMPLATES } from "@/lib/templates";
import { cloneClient, createClient } from "@/lib/actions";
import { readStore } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminPage() {
  const store = await readStore();
  const user =
    store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];

  return (
    <div className="space-y-8 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">Admin portal</p>
          <h1 className="font-display text-3xl tracking-tight">
            Design client workflows
          </h1>
          <p className="mt-1 max-w-2xl text-muted">
            Start from a template or clone an existing client, then tailor the
            form, roles, and approval path for each customer.
          </p>
        </div>
      </div>

      {!user.isAdmin ? (
        <div className="rounded-2xl border border-accent/30 bg-accent-soft/60 px-4 py-3 text-sm text-accent">
          Tip: switch to <strong>Alex Morgan</strong> (Platform Admin) in the
          header for the full admin experience. Designers are open in this demo
          for everyone.
        </div>
      ) : null}

      <section className="surface rounded-[var(--radius)] p-5">
        <h2 className="font-display text-xl">Create a client</h2>
        <form action={createClient} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label htmlFor="name">Client name</label>
            <input id="name" name="name" required placeholder="Client C" />
          </div>
          <div className="field">
            <label htmlFor="accent">Accent colour</label>
            <input
              id="accent"
              name="accent"
              type="color"
              defaultValue="#1F6F6B"
            />
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="template">Starter template</label>
            <select id="template" name="template" defaultValue="full_contract">
              {CLIENT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>
          <div className="field sm:col-span-2">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="What this client’s process covers…"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary sm:col-span-2 sm:justify-self-start"
          >
            <Plus className="h-4 w-4" /> Create client
          </button>
        </form>
      </section>

      {store.clients.length ? (
        <section className="surface rounded-[var(--radius)] p-5">
          <h2 className="font-display text-xl">Clone an existing client</h2>
          <p className="mt-1 text-sm text-muted">
            Duplicate form, roles, and workflow as a starting point.
          </p>
          <form
            action={cloneClient}
            className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_1fr_auto]"
          >
            <div className="field">
              <label htmlFor="sourceId">Source client</label>
              <select id="sourceId" name="sourceId" required>
                {store.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="clone-name">New name</label>
              <input
                id="clone-name"
                name="name"
                required
                placeholder="Client A — EU"
              />
            </div>
            <button type="submit" className="btn btn-secondary self-end">
              <Copy className="h-4 w-4" /> Clone
            </button>
          </form>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        {store.clients.map((client) => (
          <Link
            key={client.id}
            href={`/admin/clients/${client.id}`}
            className="surface group rounded-[var(--radius)] p-5 transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-2xl text-white"
                  style={{ background: client.accent }}
                >
                  <Workflow className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">{client.name}</h2>
                  <p className="text-xs text-muted">
                    Updated {formatDate(client.updatedAt)}
                  </p>
                </div>
              </div>
              <span className="badge bg-paper-2 text-muted">
                {client.workflowSteps.length} steps · {client.formFields.length}{" "}
                fields
              </span>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              {client.description || "No description yet."}
            </p>
            <p className="mt-3 text-xs font-semibold text-brand group-hover:underline">
              Configure form, roles & workflow →
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
