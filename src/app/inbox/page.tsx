import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { readStore } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { inboxForUser } from "@/lib/workflow";

export default async function InboxPage() {
  const store = await readStore();
  const user =
    store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
  const inbox = inboxForUser(store, user.id);

  return (
    <div className="space-y-6 animate-rise">
      <div>
        <p className="text-sm font-semibold text-brand">Inbox</p>
        <h1 className="font-display text-3xl tracking-tight">
          Waiting on {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted">
          Requests currently assigned to you across all clients.
        </p>
      </div>

      {inbox.length === 0 ? (
        <div className="surface rounded-[var(--radius)] px-5 py-10 text-center text-muted">
          Your inbox is clear. Switch to another demo user to see their queue.
        </div>
      ) : (
        <ul className="space-y-3 stagger">
          {inbox.map((r) => {
            const client = store.clients.find((c) => c.id === r.clientId);
            const step = r.workflowSteps[r.currentStepIndex];
            return (
              <li key={r.id}>
                <Link
                  href={`/requests/${r.id}`}
                  className="surface block rounded-[var(--radius)] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {r.reference} · {client?.name}
                      </p>
                      <h2 className="mt-1 text-lg font-semibold">{r.title}</h2>
                      <p className="mt-1 text-sm text-muted">
                        Current step: {step?.name} · Updated{" "}
                        {formatDateTime(r.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
