import Link from "next/link";
import { ArrowRight, Bell, ClipboardCheck, Settings2, Sparkles } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { readStore } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { inboxForUser, unreadCount } from "@/lib/workflow";

export default async function HomePage() {
  const store = await readStore();
  const user =
    store.users.find((u) => u.id === store.currentUserId) ?? store.users[0];
  const inbox = inboxForUser(store, user.id).slice(0, 4);
  const unread = unreadCount(store, user.id);
  const mySubmitted = store.requests
    .filter((r) => r.submitterId === user.id)
    .slice(0, 4);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-line/80 bg-[linear-gradient(135deg,#163f3d_0%,#1f6f6b_48%,#2d8a7c_100%)] px-6 py-10 text-white shadow-[0_24px_60px_rgba(22,63,61,0.28)] sm:px-10 sm:py-14 animate-rise">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 35%), radial-gradient(circle at 80% 0%, rgba(244,228,216,0.35), transparent 40%)",
          }}
        />
        <div className="relative max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Built for client-specific contract journeys
          </p>
          <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Relay
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Design a form and approval path for each client. Requests move from
            submission to signature with the right people notified at every step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/requests/new" className="btn bg-white text-brand-deep hover:bg-brand-soft">
              Start a request <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/admin"
              className="btn border border-white/25 bg-white/10 text-white hover:bg-white/15"
            >
              Open admin portal
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3 stagger">
        <Stat
          icon={<ClipboardCheck className="h-5 w-5" />}
          label="Waiting on you"
          value={String(inbox.length)}
          href="/inbox"
        />
        <Stat
          icon={<Bell className="h-5 w-5" />}
          label="Unread notifications"
          value={String(unread)}
          href="/notifications"
        />
        <Stat
          icon={<Settings2 className="h-5 w-5" />}
          label="Configured clients"
          value={String(store.clients.length)}
          href="/admin"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Your inbox"
          action={<Link href="/inbox" className="text-sm font-semibold text-brand">View all</Link>}
        >
          {inbox.length === 0 ? (
            <Empty text="Nothing assigned to you right now. Switch user to see other inboxes." />
          ) : (
            <ul className="space-y-3">
              {inbox.map((r) => (
                <RequestRow key={r.id} id={r.id} reference={r.reference} title={r.title} status={r.status} meta={r.workflowSteps[r.currentStepIndex]?.name} updatedAt={r.updatedAt} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Your submissions"
          action={<Link href="/requests/new" className="text-sm font-semibold text-brand">New request</Link>}
        >
          {mySubmitted.length === 0 ? (
            <Empty text="You haven’t submitted a request yet." />
          ) : (
            <ul className="space-y-3">
              {mySubmitted.map((r) => (
                <RequestRow key={r.id} id={r.id} reference={r.reference} title={r.title} status={r.status} meta={store.clients.find(c => c.id === r.clientId)?.name} updatedAt={r.updatedAt} />
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="surface rounded-[var(--radius)] p-6 animate-rise">
        <h2 className="font-display text-2xl">Try the Client A journey</h2>
        <ol className="mt-4 grid gap-3 text-sm text-ink-soft md:grid-cols-2">
          <li className="rounded-2xl bg-paper/80 p-4">1. Stay as <strong>Jordan Lee</strong> and submit a Client A request.</li>
          <li className="rounded-2xl bg-paper/80 p-4">2. Switch to <strong>Sam Rivera</strong> to review, edit, comment, and approve.</li>
          <li className="rounded-2xl bg-paper/80 p-4">3. Check notifications for Jordan, Casey (payroll), and Riley (contracts).</li>
          <li className="rounded-2xl bg-paper/80 p-4">4. As Riley, draft/upload the contract, then review with Taylor, issue, and confirm signed.</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href} className="surface group rounded-[var(--radius)] p-5 transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand">
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-muted transition group-hover:text-brand" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </Link>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="surface rounded-[var(--radius)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-2xl bg-paper/70 px-4 py-6 text-sm text-muted">{text}</p>;
}

function RequestRow({
  id,
  reference,
  title,
  status,
  meta,
  updatedAt,
}: {
  id: string;
  reference: string;
  title: string;
  status: import("@/lib/types").RequestStatus;
  meta?: string;
  updatedAt: string;
}) {
  return (
    <li>
      <Link
        href={`/requests/${id}`}
        className="block rounded-2xl border border-line bg-white/70 px-4 py-3 transition hover:border-brand/30 hover:bg-white"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-muted">{reference}</p>
            <p className="font-semibold text-ink">{title}</p>
            <p className="text-xs text-muted">
              {meta} · {formatDateTime(updatedAt)}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </Link>
    </li>
  );
}
