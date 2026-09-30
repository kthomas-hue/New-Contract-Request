import { nanoid } from "nanoid";
import type {
  ActivityItem,
  AppStore,
  Client,
  ContractRequest,
  NotifyTarget,
  Notification,
  User,
  WorkflowStep,
} from "./types";

export function getUser(store: AppStore, userId: string): User | undefined {
  return store.users.find((u) => u.id === userId);
}

export function getClient(store: AppStore, clientId: string): Client | undefined {
  return store.clients.find((c) => c.id === clientId);
}

export function getRequest(
  store: AppStore,
  requestId: string,
): ContractRequest | undefined {
  return store.requests.find((r) => r.id === requestId);
}

export function usersForRole(
  store: AppStore,
  clientId: string,
  roleId: string,
): User[] {
  return store.users.filter((u) => u.clientRoles[clientId]?.includes(roleId));
}

export function resolveNotifyRecipients(
  store: AppStore,
  clientId: string,
  targets: NotifyTarget[],
  request: ContractRequest,
): string[] {
  const ids = new Set<string>();
  for (const target of targets) {
    if (target.roleId === "role-submitter") {
      ids.add(request.submitterId);
      continue;
    }
    if (target.roleId) {
      for (const u of usersForRole(store, clientId, target.roleId)) {
        ids.add(u.id);
      }
    }
    for (const uid of target.userIds ?? []) {
      ids.add(uid);
    }
  }
  return [...ids];
}

export function resolveStepAssignees(
  store: AppStore,
  clientId: string,
  step: WorkflowStep,
): string[] {
  if (step.assigneeUserIds?.length) return [...step.assigneeUserIds];
  if (step.assigneeRoleId) {
    return usersForRole(store, clientId, step.assigneeRoleId).map((u) => u.id);
  }
  return [];
}

export function pushNotifications(
  store: AppStore,
  userIds: string[],
  title: string,
  body: string,
  requestId?: string,
): Notification[] {
  const created: Notification[] = [];
  const unique = [...new Set(userIds)];
  for (const userId of unique) {
    const n: Notification = {
      id: nanoid(10),
      userId,
      requestId,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    store.notifications.unshift(n);
    created.push(n);
  }
  return created;
}

export function addActivity(
  request: ContractRequest,
  partial: Omit<ActivityItem, "id" | "createdAt">,
): ActivityItem {
  const item: ActivityItem = {
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    ...partial,
  };
  request.activity.unshift(item);
  return item;
}

export function currentStep(
  request: ContractRequest,
): WorkflowStep | undefined {
  return request.workflowSteps[request.currentStepIndex];
}

export function nextReference(store: AppStore): string {
  const n = store.requests.length + 1;
  return `CR-${String(n).padStart(4, "0")}`;
}

export function unreadCount(store: AppStore, userId: string): number {
  return store.notifications.filter((n) => n.userId === userId && !n.read)
    .length;
}

export function inboxForUser(
  store: AppStore,
  userId: string,
): ContractRequest[] {
  return store.requests
    .filter(
      (r) =>
        r.status === "in_progress" && r.currentAssigneeIds.includes(userId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function requestsForUser(
  store: AppStore,
  userId: string,
): ContractRequest[] {
  return store.requests
    .filter(
      (r) =>
        r.submitterId === userId ||
        r.currentAssigneeIds.includes(userId) ||
        r.activity.some((a) => a.userId === userId) ||
        r.signedNotifyUserIds.includes(userId),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function roleLabel(client: Client, roleId?: string): string {
  if (!roleId) return "Unassigned";
  return client.roles.find((r) => r.id === roleId)?.name ?? roleId;
}

export function stepTypeLabel(type: WorkflowStep["type"]): string {
  switch (type) {
    case "approval":
      return "Approval";
    case "task":
      return "Task";
    case "document_review":
      return "Document review";
    case "issue":
      return "Issue for signature";
    case "signed":
      return "Confirm signed";
    default:
      return type;
  }
}
