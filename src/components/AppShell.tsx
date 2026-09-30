"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  PlusCircle,
  Settings2,
  Workflow,
} from "lucide-react";
import { resetDemoData, switchUser } from "@/lib/actions";
import type { User } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: ClipboardList },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/requests/new", label: "New request", icon: PlusCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/admin", label: "Admin", icon: Settings2 },
];

export function AppShell({
  children,
  users,
  currentUser,
  unread,
}: {
  children: React.ReactNode;
  users: User[];
  currentUser: User;
  unread: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-[color-mix(in_srgb,var(--paper)_78%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_rgba(31,111,107,0.28)] transition group-hover:scale-[1.03]">
              <Workflow className="h-5 w-5" />
            </span>
            <span>
              <span className="font-display block text-xl leading-none tracking-tight text-ink">
                Relay
              </span>
              <span className="text-xs text-muted">Contract request workflows</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : item.href === "/requests"
                    ? pathname === "/requests"
                    : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-brand text-white"
                      : "text-ink-soft hover:bg-white/70",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.href === "/notifications" && unread > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] text-white">
                      {unread}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <form action={resetDemoData}>
              <button type="submit" className="btn btn-ghost hidden text-xs sm:inline-flex">
                Reset demo
              </button>
            </form>
            <div className="flex items-center gap-2 rounded-full border border-line bg-white/80 py-1 pl-1 pr-3 shadow-sm">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-deep">
                {initials(currentUser.name)}
              </span>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-semibold leading-tight">
                  {currentUser.name}
                </div>
                <div className="truncate text-[11px] text-muted">{currentUser.title}</div>
              </div>
              <select
                className="max-w-[140px] border-0 bg-transparent text-xs font-semibold text-ink-soft outline-none"
                value={currentUser.id}
                onChange={(e) => {
                  void switchUser(e.target.value);
                }}
                aria-label="Switch demo user"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto px-4 pb-3 md:hidden">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : item.href === "/requests"
                  ? pathname === "/requests"
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
                  active ? "bg-brand text-white" : "bg-white/70 text-ink-soft",
                )}
              >
                {item.label}
                {item.href === "/notifications" && unread > 0 ? ` (${unread})` : ""}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
