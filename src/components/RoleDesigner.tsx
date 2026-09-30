"use client";

import { useState, useTransition } from "react";
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
import { saveClientRoles, savePeopleAssignments } from "@/lib/actions";
import type { ClientRole, User } from "@/lib/types";

const COLORS = [
  "#3D6B8C",
  "#C46B3A",
  "#1F6F6B",
  "#5B6B4A",
  "#5C4E7A",
  "#6B5B4A",
  "#8C3D5A",
  "#2F6F8C",
];

export function RoleDesigner({
  clientId,
  initialRoles,
  users,
}: {
  clientId: string;
  initialRoles: ClientRole[];
  users: User[];
}) {
  const [roles, setRoles] = useState(initialRoles);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(
    () => {
      const map: Record<string, string[]> = {};
      for (const u of users) {
        map[u.id] = [...(u.clientRoles[clientId] ?? [])];
      }
      return map;
    },
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Roles & people</h2>
          <p className="text-sm text-muted">
            Roles power step assignment and notifications. Map any person to one
            or more roles for this client.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setRoles((prev) => [
                ...prev,
                {
                  id: `role-${nanoid(6)}`,
                  name: "New role",
                  description: "",
                  color: COLORS[prev.length % COLORS.length],
                },
              ]);
              setSaved(false);
            }}
          >
            <Plus className="h-4 w-4" /> Add role
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveClientRoles(clientId, roles);
                await savePeopleAssignments(clientId, assignments);
                setSaved(true);
              })
            }
          >
            {pending ? "Saving…" : saved ? "Saved" : "Save roles & people"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.id} className="surface rounded-2xl p-4">
            <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr_auto]">
              <input
                type="color"
                value={role.color}
                className="h-11 w-14 cursor-pointer rounded-xl border border-line bg-white p-1"
                onChange={(e) => {
                  setRoles((prev) =>
                    prev.map((r) =>
                      r.id === role.id ? { ...r, color: e.target.value } : r,
                    ),
                  );
                  setSaved(false);
                }}
              />
              <div className="field">
                <label>Role name</label>
                <input
                  value={role.name}
                  onChange={(e) => {
                    setRoles((prev) =>
                      prev.map((r) =>
                        r.id === role.id ? { ...r, name: e.target.value } : r,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </div>
              <div className="field">
                <label>Description</label>
                <input
                  value={role.description ?? ""}
                  onChange={(e) => {
                    setRoles((prev) =>
                      prev.map((r) =>
                        r.id === role.id
                          ? { ...r, description: e.target.value }
                          : r,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost self-end px-2 text-danger"
                onClick={() => {
                  setRoles((prev) => prev.filter((r) => r.id !== role.id));
                  setAssignments((prev) => {
                    const next: Record<string, string[]> = {};
                    for (const [uid, roleIds] of Object.entries(prev)) {
                      next[uid] = roleIds.filter((id) => id !== role.id);
                    }
                    return next;
                  });
                  setSaved(false);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="surface rounded-[var(--radius)] p-5">
        <h3 className="font-display text-xl">People on this client</h3>
        <p className="mt-1 text-sm text-muted">
          Tick the roles each person should hold.
        </p>
        <ul className="mt-4 space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="rounded-2xl border border-line bg-white/70 p-4"
            >
              <div className="mb-3">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-muted">
                  {user.title} · {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => {
                  const checked = (assignments[user.id] ?? []).includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      style={
                        checked
                          ? {
                              background: `${role.color}22`,
                              borderColor: role.color,
                              color: role.color,
                            }
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setAssignments((prev) => {
                            const current = prev[user.id] ?? [];
                            return {
                              ...prev,
                              [user.id]: e.target.checked
                                ? [...current, role.id]
                                : current.filter((id) => id !== role.id),
                            };
                          });
                          setSaved(false);
                        }}
                      />
                      {role.name}
                    </label>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
