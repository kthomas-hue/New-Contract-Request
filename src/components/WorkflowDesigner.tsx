"use client";

import { useState, useTransition } from "react";
import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
import { saveWorkflowSteps } from "@/lib/actions";
import type { ClientRole, NotifyTarget, StepType, WorkflowStep } from "@/lib/types";
import { stepTypeLabel } from "@/lib/workflow";

const STEP_TYPES: StepType[] = [
  "approval",
  "task",
  "document_review",
  "issue",
  "signed",
];

function emptyNotify(): NotifyTarget {
  return { id: nanoid(6), roleId: "", message: "" };
}

function emptyStep(): WorkflowStep {
  return {
    id: nanoid(8),
    name: "New step",
    type: "approval",
    description: "",
    assigneeRoleId: "",
    allowEdit: false,
    allowComment: true,
    allowUpload: false,
    canRequestChanges: false,
    notifyOnEnter: [],
    notifyOnComplete: [],
  };
}

export function WorkflowDesigner({
  clientId,
  initialSteps,
  roles,
}: {
  clientId: string;
  initialSteps: WorkflowStep[];
  roles: ClientRole[];
}) {
  const [steps, setSteps] = useState(initialSteps);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSaved(false);
  }

  function updateNotify(
    stepId: string,
    key: "notifyOnEnter" | "notifyOnComplete",
    notifyId: string,
    patch: Partial<NotifyTarget>,
  ) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId
          ? {
              ...s,
              [key]: s[key].map((n) =>
                n.id === notifyId ? { ...n, ...patch } : n,
              ),
            }
          : s,
      ),
    );
    setSaved(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Workflow</h2>
          <p className="text-sm text-muted">
            Build the approval path for this client — who acts, what they can do,
            and who gets notified.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSteps((prev) => [...prev, emptyStep()]);
              setSaved(false);
            }}
          >
            <Plus className="h-4 w-4" /> Add step
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveWorkflowSteps(clientId, steps);
                setSaved(true);
              })
            }
          >
            {pending ? "Saving…" : saved ? "Saved" : "Save workflow"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="surface rounded-[var(--radius)] p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Step {index + 1} · {stepTypeLabel(step.type)}
                </p>
                <input
                  className="font-display mt-1 w-full border-0 bg-transparent text-2xl outline-none"
                  value={step.name}
                  onChange={(e) => updateStep(step.id, { name: e.target.value })}
                />
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={() => {
                    if (index === 0) return;
                    setSteps((prev) => {
                      const copy = [...prev];
                      const [item] = copy.splice(index, 1);
                      copy.splice(index - 1, 0, item);
                      return copy;
                    });
                    setSaved(false);
                  }}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-xs"
                  onClick={() => {
                    if (index >= steps.length - 1) return;
                    setSteps((prev) => {
                      const copy = [...prev];
                      const [item] = copy.splice(index, 1);
                      copy.splice(index + 1, 0, item);
                      return copy;
                    });
                    setSaved(false);
                  }}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="btn btn-ghost px-2 py-1 text-danger"
                  onClick={() => {
                    setSteps((prev) => prev.filter((s) => s.id !== step.id));
                    setSaved(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field">
                <label>Step type</label>
                <select
                  value={step.type}
                  onChange={(e) => {
                    const type = e.target.value as StepType;
                    updateStep(step.id, {
                      type,
                      allowEdit: type === "approval",
                      allowUpload:
                        type === "task" ||
                        type === "document_review" ||
                        type === "signed",
                      canRequestChanges: type === "document_review",
                    });
                  }}
                >
                  {STEP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {stepTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Assignee role</label>
                <select
                  value={step.assigneeRoleId ?? ""}
                  onChange={(e) =>
                    updateStep(step.id, { assigneeRoleId: e.target.value })
                  }
                >
                  <option value="">Select role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field sm:col-span-2">
                <label>Description</label>
                <textarea
                  value={step.description ?? ""}
                  onChange={(e) =>
                    updateStep(step.id, { description: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-ink-soft">
              {(
                [
                  ["allowEdit", "Can edit form"],
                  ["allowComment", "Can comment"],
                  ["allowUpload", "Can upload docs"],
                  ["canRequestChanges", "Can request changes"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={step[key]}
                    onChange={(e) =>
                      updateStep(step.id, { [key]: e.target.checked })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            {(
              [
                ["notifyOnEnter", "Notify when step starts"],
                ["notifyOnComplete", "Notify when step completes"],
              ] as const
            ).map(([key, title]) => (
              <div key={key} className="mt-5 rounded-2xl border border-line bg-paper/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{title}</h4>
                  <button
                    type="button"
                    className="btn btn-ghost px-2 py-1 text-xs"
                    onClick={() => {
                      updateStep(step.id, {
                        [key]: [...step[key], emptyNotify()],
                      });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {step[key].map((n) => (
                    <div
                      key={n.id}
                      className="grid gap-2 rounded-xl bg-white p-3 sm:grid-cols-[180px_1fr_auto]"
                    >
                      <select
                        value={n.roleId ?? ""}
                        onChange={(e) =>
                          updateNotify(step.id, key, n.id, {
                            roleId: e.target.value,
                          })
                        }
                      >
                        <option value="">Role…</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={n.message}
                        placeholder="Notification message"
                        onChange={(e) =>
                          updateNotify(step.id, key, n.id, {
                            message: e.target.value,
                          })
                        }
                      />
                      <button
                        type="button"
                        className="btn btn-ghost px-2 text-danger"
                        onClick={() =>
                          updateStep(step.id, {
                            [key]: step[key].filter((x) => x.id !== n.id),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {!step[key].length ? (
                    <p className="text-xs text-muted">No notifications configured.</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
