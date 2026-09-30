"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readStore, resetStore, updateStore } from "./db";
import {
  buildClientFromTemplate,
  cloneClientRecord,
  type ClientTemplateId,
} from "./templates";
import type { Client, FormField, WorkflowStep } from "./types";
import {
  addActivity,
  currentStep,
  getClient,
  getRequest,
  getUser,
  nextReference,
  pushNotifications,
  resolveNotifyRecipients,
  resolveStepAssignees,
} from "./workflow";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function switchUser(userId: string) {
  await updateStore((store) => {
    if (!store.users.some((u) => u.id === userId)) return store;
    return { ...store, currentUserId: userId };
  });
  revalidateAll();
}

export async function resetDemoData() {
  await resetStore();
  revalidateAll();
}

export async function markNotificationRead(id: string) {
  await updateStore((store) => {
    const n = store.notifications.find((x) => x.id === id);
    if (n) n.read = true;
    return store;
  });
  revalidateAll();
}

export async function markAllNotificationsRead() {
  await updateStore((store) => {
    for (const n of store.notifications) {
      if (n.userId === store.currentUserId) n.read = true;
    }
    return store;
  });
  revalidateAll();
}

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const accent = String(formData.get("accent") ?? "#1F6F6B");
  const template = String(
    formData.get("template") ?? "simple_approval",
  ) as ClientTemplateId;

  const client = buildClientFromTemplate({
    name,
    description,
    accent,
    template,
  });

  await updateStore((store) => {
    store.clients.push(client);
    return store;
  });
  revalidateAll();
  redirect(`/admin/clients/${client.id}`);
}

export async function cloneClient(formData: FormData) {
  const sourceId = String(formData.get("sourceId") ?? "");
  const name = String(formData.get("name") ?? "");
  let newId = "";

  await updateStore((store) => {
    const source = getClient(store, sourceId);
    if (!source) throw new Error("Client not found");
    const copy = cloneClientRecord(source, name || `${source.name} copy`);
    store.clients.push(copy);
    newId = copy.id;
    return store;
  });

  revalidateAll();
  redirect(`/admin/clients/${newId}`);
}

export async function savePeopleAssignments(
  clientId: string,
  assignments: Record<string, string[]>,
) {
  await updateStore((store) => {
    for (const user of store.users) {
      const roles = assignments[user.id];
      if (roles === undefined) continue;
      if (!roles.length) {
        delete user.clientRoles[clientId];
      } else {
        user.clientRoles[clientId] = roles;
      }
    }
    return store;
  });
  revalidateAll();
}

export async function updateClientMeta(
  clientId: string,
  input: { name: string; description?: string; accent?: string },
) {
  await updateStore((store) => {
    const client = getClient(store, clientId);
    if (!client) throw new Error("Client not found");
    client.name = input.name.trim();
    client.description = input.description?.trim() || "";
    if (input.accent) client.accent = input.accent;
    client.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function saveFormFields(clientId: string, fields: FormField[]) {
  await updateStore((store) => {
    const client = getClient(store, clientId);
    if (!client) throw new Error("Client not found");
    client.formFields = fields;
    client.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function saveWorkflowSteps(
  clientId: string,
  steps: WorkflowStep[],
) {
  await updateStore((store) => {
    const client = getClient(store, clientId);
    if (!client) throw new Error("Client not found");
    client.workflowSteps = steps;
    client.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function saveClientRoles(
  clientId: string,
  roles: Client["roles"],
) {
  await updateStore((store) => {
    const client = getClient(store, clientId);
    if (!client) throw new Error("Client not found");
    client.roles = roles;
    client.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function submitRequest(input: {
  clientId: string;
  formData: Record<string, string | number | boolean>;
  title?: string;
}) {
  let requestId = "";

  await updateStore((store) => {
    const client = getClient(store, input.clientId);
    if (!client) throw new Error("Client not found");
    if (!client.workflowSteps.length) {
      throw new Error("This client has no workflow configured yet");
    }

    const submitter = getUser(store, store.currentUserId);
    if (!submitter) throw new Error("No current user");

    const firstStep = client.workflowSteps[0];
    const assignees = resolveStepAssignees(store, client.id, firstStep);
    const nameField =
      (input.formData.candidate_name as string) ||
      (input.formData.worker_name as string) ||
      "New request";

    const request = {
      id: nanoid(10),
      reference: nextReference(store),
      clientId: client.id,
      title: input.title?.trim() || `${nameField} — ${client.name}`,
      status: "in_progress" as const,
      currentStepIndex: 0,
      workflowSteps: structuredClone(client.workflowSteps),
      formFields: structuredClone(client.formFields),
      formData: input.formData,
      submitterId: submitter.id,
      currentAssigneeIds: assignees,
      documents: [],
      activity: [] as ReturnType<typeof addActivity>[],
      signedNotifyUserIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addActivity(request, {
      kind: "submitted",
      userId: submitter.id,
      stepId: firstStep.id,
      message: `${submitter.name} submitted the request`,
    });

    const enterRecipients = resolveNotifyRecipients(
      store,
      client.id,
      firstStep.notifyOnEnter,
      request,
    );
    pushNotifications(
      store,
      enterRecipients,
      `${request.reference}: ${firstStep.name}`,
      firstStep.notifyOnEnter[0]?.message ||
        `A request needs your attention for ${client.name}.`,
      request.id,
    );

    addActivity(request, {
      kind: "step_started",
      userId: submitter.id,
      stepId: firstStep.id,
      message: `Workflow started — ${firstStep.name}`,
    });

    store.requests.unshift(request);
    requestId = request.id;
    return store;
  });

  revalidateAll();
  redirect(`/requests/${requestId}`);
}

async function advanceOrComplete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any,
  requestId: string,
  actorId: string,
) {
  const request = getRequest(store, requestId);
  if (!request) throw new Error("Request not found");
  const step = currentStep(request);
  if (!step) throw new Error("No active step");

  const completeRecipients = resolveNotifyRecipients(
    store,
    request.clientId,
    step.notifyOnComplete,
    request,
  );

  // Extra signed notify list
  if (step.type === "signed") {
    for (const uid of request.signedNotifyUserIds) {
      completeRecipients.push(uid);
    }
  }

  pushNotifications(
    store,
    completeRecipients,
    `${request.reference}: ${step.name} complete`,
    step.notifyOnComplete[0]?.message ||
      `${step.name} was completed on ${request.reference}.`,
    request.id,
  );

  const nextIndex = request.currentStepIndex + 1;
  if (nextIndex >= request.workflowSteps.length) {
    request.status = "completed";
    request.completedAt = new Date().toISOString();
    request.currentAssigneeIds = [];
    addActivity(request, {
      kind: "signed",
      userId: actorId,
      stepId: step.id,
      message: "Workflow completed",
    });
  } else {
    request.currentStepIndex = nextIndex;
    const next = request.workflowSteps[nextIndex];
    request.currentAssigneeIds = resolveStepAssignees(
      store,
      request.clientId,
      next,
    );
    addActivity(request, {
      kind: "step_started",
      userId: actorId,
      stepId: next.id,
      message: `Moved to ${next.name}`,
    });
    const enterRecipients = resolveNotifyRecipients(
      store,
      request.clientId,
      next.notifyOnEnter,
      request,
    );
    pushNotifications(
      store,
      enterRecipients,
      `${request.reference}: ${next.name}`,
      next.notifyOnEnter[0]?.message ||
        `${next.name} is ready on ${request.reference}.`,
      request.id,
    );
  }
  request.updatedAt = new Date().toISOString();
}

export async function approveStep(
  requestId: string,
  input: {
    comment?: string;
    formData?: Record<string, string | number | boolean>;
  },
) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step) throw new Error("No step");
    if (!request.currentAssigneeIds.includes(actor.id) && !actor.isAdmin) {
      throw new Error("You are not assigned to this step");
    }

    if (input.formData && step.allowEdit) {
      request.formData = { ...request.formData, ...input.formData };
      addActivity(request, {
        kind: "edited",
        userId: actor.id,
        stepId: step.id,
        message: `${actor.name} updated request details`,
      });
    }

    if (input.comment?.trim()) {
      addActivity(request, {
        kind: "commented",
        userId: actor.id,
        stepId: step.id,
        message: input.comment.trim(),
      });
    }

    addActivity(request, {
      kind: "approved",
      userId: actor.id,
      stepId: step.id,
      message: `${actor.name} approved — ${step.name}`,
    });

    advanceOrComplete(store, requestId, actor.id);
    return store;
  });
  revalidateAll();
}

export async function declineStep(requestId: string, comment: string) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step) throw new Error("No step");

    if (comment.trim()) {
      addActivity(request, {
        kind: "commented",
        userId: actor.id,
        stepId: step.id,
        message: comment.trim(),
      });
    }

    addActivity(request, {
      kind: "declined",
      userId: actor.id,
      stepId: step.id,
      message: `${actor.name} declined — ${step.name}`,
    });

    const declineAction = step.declineAction ?? "end";
    if (declineAction === "previous" && request.currentStepIndex > 0) {
      request.currentStepIndex -= 1;
      const previous = request.workflowSteps[request.currentStepIndex];
      request.currentAssigneeIds = resolveStepAssignees(
        store,
        request.clientId,
        previous,
      );
      request.status = "in_progress";
      addActivity(request, {
        kind: "step_started",
        userId: actor.id,
        stepId: previous.id,
        message: `Sent back to ${previous.name}`,
      });
      pushNotifications(
        store,
        [
          request.submitterId,
          ...request.currentAssigneeIds,
        ],
        `${request.reference}: Sent back`,
        comment.trim() ||
          `${step.name} was declined and sent back to ${previous.name}.`,
        request.id,
      );
    } else {
      request.status = "declined";
      request.currentAssigneeIds = [];
      pushNotifications(
        store,
        [request.submitterId],
        `${request.reference}: Declined`,
        comment.trim() || "Your request was declined.",
        request.id,
      );
    }

    request.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function addComment(requestId: string, comment: string) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request) throw new Error("Not found");
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);

    addActivity(request, {
      kind: "commented",
      userId: actor.id,
      stepId: step?.id,
      message: comment.trim(),
    });
    request.updatedAt = new Date().toISOString();

    const notify = new Set(request.currentAssigneeIds);
    notify.add(request.submitterId);
    notify.delete(actor.id);
    pushNotifications(
      store,
      [...notify],
      `${request.reference}: New comment`,
      `${actor.name}: ${comment.trim().slice(0, 120)}`,
      request.id,
    );
    return store;
  });
  revalidateAll();
}

export async function completeTask(
  requestId: string,
  input: { comment?: string; fileName?: string },
) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step || (step.type !== "task" && step.type !== "issue" && step.type !== "signed")) {
      throw new Error("This step cannot be completed this way");
    }

    if (input.fileName?.trim()) {
      request.documents.unshift({
        id: nanoid(8),
        name: input.fileName.trim(),
        fileName: input.fileName.trim(),
        uploadedById: actor.id,
        uploadedAt: new Date().toISOString(),
        note: input.comment,
      });
      addActivity(request, {
        kind: "document_uploaded",
        userId: actor.id,
        stepId: step.id,
        message: `${actor.name} uploaded ${input.fileName.trim()}`,
      });
    }

    if (input.comment?.trim() && !input.fileName) {
      addActivity(request, {
        kind: "commented",
        userId: actor.id,
        stepId: step.id,
        message: input.comment.trim(),
      });
    }

    const kind =
      step.type === "issue"
        ? "issued"
        : step.type === "signed"
          ? "signed"
          : "task_completed";

    addActivity(request, {
      kind,
      userId: actor.id,
      stepId: step.id,
      message: `${actor.name} completed — ${step.name}`,
    });

    advanceOrComplete(store, requestId, actor.id);
    return store;
  });
  revalidateAll();
}

export async function approveDocument(requestId: string, comment?: string) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step || step.type !== "document_review") {
      throw new Error("Not a document review step");
    }

    if (comment?.trim()) {
      addActivity(request, {
        kind: "commented",
        userId: actor.id,
        stepId: step.id,
        message: comment.trim(),
      });
    }

    addActivity(request, {
      kind: "approved",
      userId: actor.id,
      stepId: step.id,
      message: `${actor.name} approved the contract draft`,
    });

    advanceOrComplete(store, requestId, actor.id);
    return store;
  });
  revalidateAll();
}

export async function requestDocumentChanges(
  requestId: string,
  comment: string,
) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step || step.type !== "document_review") {
      throw new Error("Not a document review step");
    }

    addActivity(request, {
      kind: "changes_requested",
      userId: actor.id,
      stepId: step.id,
      message: comment.trim() || "Changes requested on the contract",
    });

    // Send back to contracts team (previous task step assignees / contracts role)
    const client = getClient(store, request.clientId);
    const contractsRole = client?.roles.find((r) =>
      r.name.toLowerCase().includes("contract"),
    );
    const drafters = contractsRole
      ? store.users
          .filter((u) =>
            u.clientRoles[request.clientId]?.includes(contractsRole.id),
          )
          .map((u) => u.id)
      : [];

    // Stay on same step but reassign to drafters so they can upload a new version
    request.currentAssigneeIds = drafters.length
      ? drafters
      : request.currentAssigneeIds;
    request.updatedAt = new Date().toISOString();

    pushNotifications(
      store,
      request.currentAssigneeIds,
      `${request.reference}: Changes requested`,
      comment.trim() || "Please revise the contract and upload a new version.",
      request.id,
    );

    return store;
  });
  revalidateAll();
}

export async function uploadDocumentRevision(
  requestId: string,
  input: { fileName: string; note?: string },
) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);
    if (!step) throw new Error("No step");

    request.documents.unshift({
      id: nanoid(8),
      name: input.fileName.trim(),
      fileName: input.fileName.trim(),
      uploadedById: actor.id,
      uploadedAt: new Date().toISOString(),
      note: input.note,
    });

    addActivity(request, {
      kind: "document_uploaded",
      userId: actor.id,
      stepId: step.id,
      message: `${actor.name} uploaded revised ${input.fileName.trim()}`,
    });

    // Reassign back to original review role
    if (step.type === "document_review") {
      request.currentAssigneeIds = resolveStepAssignees(
        store,
        request.clientId,
        step,
      );
      const enterRecipients = resolveNotifyRecipients(
        store,
        request.clientId,
        step.notifyOnEnter,
        request,
      );
      pushNotifications(
        store,
        enterRecipients,
        `${request.reference}: Revised contract ready`,
        "A new contract version is ready for review.",
        request.id,
      );
    }

    request.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function reassignStep(requestId: string, userIds: string[]) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request || request.status !== "in_progress") {
      throw new Error("Request is not actionable");
    }
    const actor = getUser(store, store.currentUserId);
    if (!actor) throw new Error("No user");
    const step = currentStep(request);

    request.currentAssigneeIds = userIds;
    request.updatedAt = new Date().toISOString();

    addActivity(request, {
      kind: "reassigned",
      userId: actor.id,
      stepId: step?.id,
      message: `${actor.name} reassigned this step`,
    });

    pushNotifications(
      store,
      userIds,
      `${request.reference}: Assigned to you`,
      `You have been asked to review ${request.title}.`,
      request.id,
    );

    return store;
  });
  revalidateAll();
}

export async function updateSignedNotifyList(
  requestId: string,
  userIds: string[],
) {
  await updateStore((store) => {
    const request = getRequest(store, requestId);
    if (!request) throw new Error("Not found");
    request.signedNotifyUserIds = userIds;
    request.updatedAt = new Date().toISOString();
    return store;
  });
  revalidateAll();
}

export async function getCurrentStore() {
  return readStore();
}
