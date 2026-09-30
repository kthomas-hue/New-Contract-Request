import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MessageSquare } from "lucide-react";
import { FormRenderer } from "@/components/FormRenderer";
import { RequestActions } from "@/components/RequestActions";
import { StatusBadge } from "@/components/StatusBadge";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { readStore } from "@/lib/db";
import { formatDateTime, initials } from "@/lib/utils";
import { getClient, getRequest, getUser } from "@/lib/workflow";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = await readStore();
  const request = getRequest(store, id);
  if (!request) notFound();
  const client = getClient(store, request.clientId);
  if (!client) notFound();
  const submitter = getUser(store, request.submitterId);
  const currentUser = getUser(store, store.currentUserId);
  const isAssignee =
    !!currentUser &&
    (request.currentAssigneeIds.includes(currentUser.id) ||
      currentUser.isAdmin);

  const assignees = request.currentAssigneeIds
    .map((uid) => getUser(store, uid))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 animate-rise">
        <div>
          <Link href="/inbox" className="text-sm font-semibold text-brand">
            ← Back
          </Link>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {request.reference} · {client.name}
          </p>
          <h1 className="font-display mt-1 text-3xl tracking-tight sm:text-4xl">
            {request.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Submitted by {submitter?.name ?? "Unknown"} ·{" "}
            {formatDateTime(request.createdAt)}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <RequestActions
            request={request}
            client={client}
            users={store.users}
            currentUserId={store.currentUserId}
            isAssignee={isAssignee}
          />

          <section className="surface rounded-[var(--radius)] p-5 animate-rise">
            <h2 className="font-display text-xl">Request details</h2>
            <div className="mt-4">
              <FormRenderer
                fields={request.formFields}
                values={request.formData}
                readOnly
              />
            </div>
          </section>

          <section className="surface rounded-[var(--radius)] p-5">
            <h2 className="font-display mb-4 text-xl">Documents</h2>
            {request.documents.length === 0 ? (
              <p className="text-sm text-muted">No documents uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {request.documents.map((doc) => {
                  const uploader = getUser(store, doc.uploadedById);
                  return (
                    <li
                      key={doc.id}
                      className="flex items-start gap-3 rounded-2xl border border-line bg-white/70 px-3 py-3"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                        <FileText className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-semibold">{doc.fileName}</p>
                        <p className="text-xs text-muted">
                          {uploader?.name} · {formatDateTime(doc.uploadedAt)}
                        </p>
                        {doc.note ? (
                          <p className="mt-1 text-sm text-ink-soft">{doc.note}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="surface rounded-[var(--radius)] p-5">
            <h2 className="font-display mb-4 flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5 text-brand" />
              Activity
            </h2>
            <ul className="space-y-3">
              {request.activity.map((item) => {
                const actor = getUser(store, item.userId);
                return (
                  <li key={item.id} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-2 text-xs font-bold text-ink-soft">
                      {initials(actor?.name ?? "?")}
                    </span>
                    <div>
                      <p className="text-sm text-ink">
                        <span className="font-semibold">{actor?.name}</span>{" "}
                        <span className="text-muted">· {item.kind.replace("_", " ")}</span>
                      </p>
                      <p className="text-sm text-ink-soft">{item.message}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface rounded-[var(--radius)] p-5 animate-rise">
            <h2 className="font-display text-xl">Workflow</h2>
            <div className="mt-4">
              <WorkflowTimeline request={request} />
            </div>
          </section>

          <section className="surface rounded-[var(--radius)] p-5">
            <h2 className="font-display text-xl">Current assignees</h2>
            {assignees.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nobody currently assigned.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {assignees.map((u) =>
                  u ? (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 rounded-xl bg-paper/80 px-3 py-2"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-deep">
                        {initials(u.name)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-muted">{u.title}</p>
                      </div>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
