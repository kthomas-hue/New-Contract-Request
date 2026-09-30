export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "email"
  | "currency"
  | "checkbox";

export type StepType =
  | "approval"
  | "task"
  | "document_review"
  | "issue"
  | "signed";

export type RequestStatus =
  | "draft"
  | "in_progress"
  | "declined"
  | "completed"
  | "cancelled";

export type ActivityKind =
  | "submitted"
  | "approved"
  | "declined"
  | "commented"
  | "edited"
  | "task_completed"
  | "document_uploaded"
  | "changes_requested"
  | "issued"
  | "signed"
  | "notified"
  | "reassigned"
  | "step_started";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface NotifyTarget {
  id: string;
  roleId?: string;
  userIds?: string[];
  message: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  description?: string;
  assigneeRoleId?: string;
  assigneeUserIds?: string[];
  allowEdit: boolean;
  allowComment: boolean;
  allowUpload: boolean;
  canRequestChanges: boolean;
  notifyOnEnter: NotifyTarget[];
  notifyOnComplete: NotifyTarget[];
}

export interface ClientRole {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  description?: string;
  accent: string;
  roles: ClientRole[];
  formFields: FormField[];
  workflowSteps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  title: string;
  /** Global admin can configure clients/workflows */
  isAdmin: boolean;
  /** Map of clientId -> roleIds */
  clientRoles: Record<string, string[]>;
}

export interface Notification {
  id: string;
  userId: string;
  requestId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface DocumentVersion {
  id: string;
  name: string;
  uploadedById: string;
  uploadedAt: string;
  note?: string;
  /** Simulated file reference */
  fileName: string;
}

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  userId: string;
  stepId?: string;
  message: string;
  createdAt: string;
  meta?: Record<string, string>;
}

export interface ContractRequest {
  id: string;
  reference: string;
  clientId: string;
  title: string;
  status: RequestStatus;
  currentStepIndex: number;
  /** Snapshot of workflow at submission time */
  workflowSteps: WorkflowStep[];
  formFields: FormField[];
  formData: Record<string, string | number | boolean>;
  submitterId: string;
  /** Current assignees for active step (can be reassigned) */
  currentAssigneeIds: string[];
  documents: DocumentVersion[];
  activity: ActivityItem[];
  /** Extra people to notify on signed (beyond workflow config) */
  signedNotifyUserIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AppStore {
  users: User[];
  clients: Client[];
  requests: ContractRequest[];
  notifications: Notification[];
  currentUserId: string;
}
