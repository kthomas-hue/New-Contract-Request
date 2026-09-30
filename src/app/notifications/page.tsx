import Link from "next/link";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions";
import { readStore } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const store = await readStore();
  const userId = store.currentUserId;
  const notes = store.notifications.filter((n) => n.userId === userId);

  return (
    <div className="space-y-6 animate-rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand">Notifications</p>
          <h1 className="font-display text-3xl tracking-tight">Updates</h1>
        </div>
        <form action={markAllNotificationsRead}>
          <button type="submit" className="btn btn-secondary">
            Mark all read
          </button>
        </form>
      </div>

      {notes.length === 0 ? (
        <div className="surface rounded-[var(--radius)] px-5 py-10 text-center text-muted">
          No notifications yet. Approve a request to see the cascade.
        </div>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => (
            <li
              key={n.id}
              className={`surface rounded-2xl p-4 ${n.read ? "opacity-70" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">{n.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {n.requestId ? (
                    <Link
                      href={`/requests/${n.requestId}`}
                      className="btn btn-secondary px-3 py-1.5 text-xs"
                    >
                      Open
                    </Link>
                  ) : null}
                  {!n.read ? (
                    <form action={markNotificationRead.bind(null, n.id)}>
                      <button
                        type="submit"
                        className="btn btn-ghost px-3 py-1.5 text-xs"
                      >
                        Mark read
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
