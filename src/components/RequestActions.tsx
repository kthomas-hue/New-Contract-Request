"use client";

import { useState, useTransition } from "react";
import {
  addComment,
  approveDocument,
  approveStep,
  completeTask,
  declineStep,
  reassignStep,
  requestDocumentChanges,
  updateSignedNotifyList,
  uploadDocumentRevision,
} from "@/lib/actions";
import type { Client, ContractRequest, User } from "@/lib/types";
import { FormRenderer } from "./FormRenderer";

export function RequestActions({
  request,
  client,
  users,
  currentUserId,
  isAssignee,
}: {
  request: ContractRequest;
  client: Client;
  users: User[];
  currentUserId: string;
  isAssignee: boolean;
}) {
  const step = request.workflowSteps[request.currentStepIndex];
  const [comment, setComment] = useState("");
  const [fileName, setFileName] = useState("Contract-Draft.docx");
  const [formData, setFormData] = useState(request.formData);
  const [assigneeIds, setAssigneeIds] = useState(request.currentAssigneeIds);
  const [signedNotify, setSignedNotify] = useState(request.signedNotifyUserIds);
  const [pending, startTransition] = useTransition();

  if (request.status !== "in_progress" || !step) {
    return (
      <div className="surface rounded-[var(--radius)] p-5 text-sm text-muted">
        This request is {request.status.replace("_", " ")}. No further actions
        are available.
      </div>
    );
  }

  const clientUsers = users.filter((u) => u.clientRoles[client.id]?.length);

  return (
    <div className="surface space-y-5 rounded-[var(--radius)] p-5 animate-rise">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Your action
        </p>
        <h2 className="font-display mt-1 text-2xl text-ink">{step.name}</h2>
        {step.description ? (
          <p className="mt-1 text-sm text-muted">{step.description}</p>
        ) : null}
        {!isAssignee ? (
          <p className="mt-3 rounded-xl bg-accent-soft/70 px-3 py-2 text-sm text-accent">
            You are not the current assignee. You can still comment. Switch user
            in the header to act as an assignee.
          </p>
        ) : null}
      </div>

      {step.allowEdit && isAssignee ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Edit request details</h3>
          <FormRenderer
            fields={request.formFields}
            values={formData}
            onChange={(id, value) =>
              setFormData((prev) => ({ ...prev, [id]: value }))
            }
          />
        </div>
      ) : null}

      {step.allowComment || step.canRequestChanges ? (
        <div className="field">
          <label htmlFor="comment">Comment</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add context for the next person…"
          />
        </div>
      ) : null}

      {(step.allowUpload || step.type === "task" || step.type === "signed") &&
      isAssignee ? (
        <div className="field">
          <label htmlFor="file">Document file name</label>
          <input
            id="file"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Offer-Letter-v2.docx"
          />
          <span className="help">
            Demo mode: enter a Word filename to simulate uploading a contract.
          </span>
        </div>
      ) : null}

      {step.type === "signed" ? (
        <div className="field">
          <label>Also notify when signed</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {clientUsers.map((u) => {
              const checked = signedNotify.includes(u.id);
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setSignedNotify((prev) =>
                        e.target.checked
                          ? [...prev, u.id]
                          : prev.filter((id) => id !== u.id),
                      );
                    }}
                  />
                  {u.name}
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-ghost mt-2 self-start text-xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await updateSignedNotifyList(request.id, signedNotify);
              })
            }
          >
            Save notify list
          </button>
        </div>
      ) : null}

      {step.type === "document_review" ? (
        <div className="field">
          <label>Send / reassign review to</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {clientUsers.map((u) => {
              const checked = assigneeIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      setAssigneeIds((prev) =>
                        e.target.checked
                          ? [...prev, u.id]
                          : prev.filter((id) => id !== u.id),
                      );
                    }}
                  />
                  {u.name} · {u.title}
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="btn btn-secondary mt-2 self-start"
            disabled={pending || !assigneeIds.length}
            onClick={() =>
              startTransition(async () => {
                await reassignStep(request.id, assigneeIds);
              })
            }
          >
            Update reviewers
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-1">
        {step.type === "approval" && isAssignee ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await approveStep(request.id, {
                    comment,
                    formData: step.allowEdit ? formData : undefined,
                  });
                })
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await declineStep(request.id, comment || "Declined");
                })
              }
            >
              Decline
            </button>
          </>
        ) : null}

        {(step.type === "task" ||
          step.type === "issue" ||
          step.type === "signed") &&
        isAssignee ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await completeTask(request.id, {
                  comment,
                  fileName:
                    step.allowUpload || step.type === "signed"
                      ? fileName
                      : undefined,
                });
              })
            }
          >
            {step.type === "issue"
              ? "Mark issued"
              : step.type === "signed"
                ? "Confirm signed"
                : "Mark complete"}
          </button>
        ) : null}

        {step.type === "document_review" && isAssignee ? (
          <>
            <button
              type="button"
              className="btn btn-primary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await approveDocument(request.id, comment);
                })
              }
            >
              Approve draft
            </button>
            {step.canRequestChanges ? (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={pending || !comment.trim()}
                onClick={() =>
                  startTransition(async () => {
                    await requestDocumentChanges(request.id, comment);
                    setComment("");
                  })
                }
              >
                Request changes
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending || !fileName.trim()}
              onClick={() =>
                startTransition(async () => {
                  await uploadDocumentRevision(request.id, {
                    fileName,
                    note: comment,
                  });
                })
              }
            >
              Upload revision
            </button>
          </>
        ) : null}

        {(step.allowComment || !isAssignee) && comment.trim() ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await addComment(request.id, comment);
                setComment("");
              })
            }
          >
            Post comment only
          </button>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Acting as current user id: {currentUserId.slice(0, 12)}…
      </p>
    </div>
  );
}
