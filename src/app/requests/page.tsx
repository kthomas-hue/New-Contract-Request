import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { readStore } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { requestsForUser } from "@/lib/workflow";

export default async function RequestsPage() {
  const store = await readStore();
  const user =
    store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
  const mine = requestsForUser(store, user.id);
  const all = user.isAdmin
    ? [...store.requests].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    : mine;

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">Requests</p>
          <h1 className="font-display text-3xl tracking-tight">
            {user.isAdmin ? "All requests" : "Your requests"}
          </h1>
          <p className="mt-1 text-muted">
            Track every request you submitted, were assigned, or were notified
            about.
          </p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          New request
        </Link>
      </div>

      {all.length === 0 ? (
        <div className="surface rounded-[var(--radius)] px-5 py-10 text-center text-muted">
          No requests yet.{" "}
          <Link href="/requests/new" className="font-semibold text-brand">
            Start one
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3 stagger">
          {all.map((r) => {
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
                        {r.status === "in_progress"
                          ? `Current: ${step?.name}`
                          : r.status.replace("_", " ")}{" "}
                        · Updated {formatDateTime(r.updatedAt)}
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
