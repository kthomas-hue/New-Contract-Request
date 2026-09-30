import { nanoid } from "nanoid";
import type { Client, FormField, WorkflowStep } from "./types";

export type ClientTemplateId =
  | "full_contract"
  | "simple_approval"
  | "contractor"
  | "blank";

export const CLIENT_TEMPLATES: {
  id: ClientTemplateId;
  name: string;
  description: string;
}[] = [
  {
    id: "full_contract",
    name: "Full contract journey",
    description:
      "Approve → draft → document review loop → issue → confirm signed.",
  },
  {
    id: "simple_approval",
    name: "Simple approval",
    description: "One approval step with notify-on-complete.",
  },
  {
    id: "contractor",
    name: "Contractor engagement",
    description: "Finance approval then issue agreement — lighter path.",
  },
  {
    id: "blank",
    name: "Blank",
    description: "Start from scratch with empty form and one approval step.",
  },
];

function nid() {
  return nanoid(8);
}

function notify(roleId: string, message: string) {
  return { id: nanoid(6), roleId, message };
}

function defaultRoles(): Client["roles"] {
  return [
    {
      id: "role-submitter",
      name: "Requester",
      description: "Submits requests",
      color: "#3D6B8C",
    },
    {
      id: "role-approver",
      name: "Approver",
      description: "Reviews and decides",
      color: "#C46B3A",
    },
    {
      id: "role-payroll",
      name: "Payroll",
      description: "Notified of offers",
      color: "#5B6B4A",
    },
    {
      id: "role-contracts",
      name: "Contracts",
      description: "Drafts and issues documents",
      color: "#1F6F6B",
    },
    {
      id: "role-legal",
      name: "Legal / reviewer",
      description: "Reviews drafts",
      color: "#5C4E7A",
    },
    {
      id: "role-employee",
      name: "Employee / worker",
      description: "Receives issued documents",
      color: "#6B5B4A",
    },
  ];
}

function fullContractFields(): FormField[] {
  return [
    {
      id: "section_candidate",
      label: "Candidate",
      type: "section",
      required: false,
      helpText: "Who the contract is for",
      width: "full",
    },
    {
      id: "candidate_name",
      label: "Candidate full name",
      type: "text",
      required: true,
      placeholder: "Morgan Blake",
    },
    {
      id: "candidate_email",
      label: "Candidate email",
      type: "email",
      required: true,
    },
    {
      id: "candidate_phone",
      label: "Phone",
      type: "phone",
      required: false,
    },
    {
      id: "job_title",
      label: "Job title",
      type: "text",
      required: true,
    },
    {
      id: "department",
      label: "Department",
      type: "select",
      required: true,
      options: ["Engineering", "Design", "People", "Finance", "Operations"],
    },
    {
      id: "start_date",
      label: "Start date",
      type: "date",
      required: true,
    },
    {
      id: "salary",
      label: "Annual salary",
      type: "currency",
      required: true,
    },
    {
      id: "contract_type",
      label: "Contract type",
      type: "select",
      required: true,
      options: ["Permanent", "Fixed term", "Contractor"],
    },
    {
      id: "benefits",
      label: "Benefits to include",
      type: "multiselect",
      required: false,
      options: ["Pension", "Private medical", "Bonus", "Equity"],
      width: "full",
    },
    {
      id: "notes",
      label: "Notes",
      type: "textarea",
      required: false,
      width: "full",
    },
  ];
}

function fullContractSteps(): WorkflowStep[] {
  return [
    {
      id: nid(),
      name: "Approver review",
      type: "approval",
      description: "Edit details, comment, approve or decline.",
      assigneeRoleId: "role-approver",
      allowEdit: true,
      allowComment: true,
      allowUpload: false,
      canRequestChanges: false,
      declineAction: "end",
      notifyOnEnter: [
        notify("role-approver", "A new contract request is waiting for review."),
      ],
      notifyOnComplete: [
        notify(
          "role-submitter",
          "Your request was approved and is moving to drafting.",
        ),
        notify("role-payroll", "New offer approved — prepare payroll."),
        notify("role-contracts", "Please draft the contract."),
      ],
    },
    {
      id: nid(),
      name: "Draft contract",
      type: "task",
      description: "Draft the Word contract and upload it.",
      assigneeRoleId: "role-contracts",
      allowEdit: false,
      allowComment: true,
      allowUpload: true,
      canRequestChanges: false,
      declineAction: "end",
      notifyOnEnter: [notify("role-contracts", "Contract drafting is ready.")],
      notifyOnComplete: [],
    },
    {
      id: nid(),
      name: "Contract review",
      type: "document_review",
      description: "Reviewers can approve or request changes.",
      assigneeRoleId: "role-legal",
      allowEdit: false,
      allowComment: true,
      allowUpload: true,
      canRequestChanges: true,
      declineAction: "end",
      notifyOnEnter: [
        notify("role-legal", "A contract is ready for your review."),
      ],
      notifyOnComplete: [
        notify("role-contracts", "Review complete — ready to issue."),
      ],
    },
    {
      id: nid(),
      name: "Issue to employee",
      type: "issue",
      description: "Send the approved contract for signature.",
      assigneeRoleId: "role-contracts",
      allowEdit: false,
      allowComment: true,
      allowUpload: false,
      canRequestChanges: false,
      declineAction: "end",
      notifyOnEnter: [],
      notifyOnComplete: [
        notify("role-employee", "Your contract is ready to sign."),
      ],
    },
    {
      id: nid(),
      name: "Confirm signed",
      type: "signed",
      description: "Confirm signed return and notify stakeholders.",
      assigneeRoleId: "role-contracts",
      allowEdit: false,
      allowComment: true,
      allowUpload: true,
      canRequestChanges: false,
      declineAction: "end",
      notifyOnEnter: [],
      notifyOnComplete: [
        notify("role-submitter", "The contract has been signed."),
        notify("role-approver", "The contract has been signed."),
        notify("role-payroll", "Signed contract received."),
      ],
    },
  ];
}

export function buildClientFromTemplate(input: {
  name: string;
  description?: string;
  accent?: string;
  template: ClientTemplateId;
}): Client {
  const now = new Date().toISOString();
  const id = nanoid(8);
  const slug =
    input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || id;

  const base = {
    id,
    name: input.name.trim(),
    slug,
    description: input.description?.trim() || "",
    accent: input.accent || "#1F6F6B",
    createdAt: now,
    updatedAt: now,
  };

  if (input.template === "full_contract") {
    return {
      ...base,
      roles: defaultRoles(),
      formFields: fullContractFields(),
      workflowSteps: fullContractSteps(),
    };
  }

  if (input.template === "contractor") {
    return {
      ...base,
      roles: [
        ...defaultRoles().filter((r) =>
          [
            "role-submitter",
            "role-approver",
            "role-contracts",
            "role-payroll",
          ].includes(r.id),
        ),
        {
          id: "role-hr",
          name: "HR",
          description: "People ops",
          color: "#5B6B4A",
        },
      ],
      formFields: [
        {
          id: "worker_name",
          label: "Worker name",
          type: "text",
          required: true,
        },
        {
          id: "engagement",
          label: "Engagement type",
          type: "select",
          required: true,
          options: ["Extension", "New contractor", "Conversion"],
        },
        {
          id: "day_rate",
          label: "Day rate",
          type: "currency",
          required: true,
        },
        {
          id: "end_date",
          label: "End date",
          type: "date",
          required: true,
        },
        {
          id: "website",
          label: "Portfolio / LinkedIn",
          type: "url",
          required: false,
        },
        {
          id: "justification",
          label: "Business justification",
          type: "textarea",
          required: true,
          width: "full",
        },
      ],
      workflowSteps: [
        {
          id: nid(),
          name: "Finance approval",
          type: "approval",
          description: "Finance reviews rate and justification.",
          assigneeRoleId: "role-approver",
          allowEdit: true,
          allowComment: true,
          allowUpload: false,
          canRequestChanges: false,
          declineAction: "previous",
          notifyOnEnter: [
            notify("role-approver", "A contractor request needs approval."),
          ],
          notifyOnComplete: [
            notify("role-hr", "Approved — prepare paperwork."),
            notify("role-contracts", "Approved — issue the agreement."),
          ],
        },
        {
          id: nid(),
          name: "Issue agreement",
          type: "issue",
          description: "Issue the agreement to the worker.",
          assigneeRoleId: "role-contracts",
          allowEdit: false,
          allowComment: true,
          allowUpload: true,
          canRequestChanges: false,
          declineAction: "end",
          notifyOnEnter: [],
          notifyOnComplete: [
            notify("role-submitter", "Agreement has been issued."),
            notify("role-payroll", "Agreement issued."),
          ],
        },
      ],
    };
  }

  if (input.template === "simple_approval") {
    return {
      ...base,
      roles: defaultRoles().slice(0, 3),
      formFields: [
        {
          id: "request_title",
          label: "Request title",
          type: "text",
          required: true,
        },
        {
          id: "details",
          label: "Details",
          type: "textarea",
          required: true,
          width: "full",
        },
        {
          id: "amount",
          label: "Amount",
          type: "currency",
          required: false,
        },
        {
          id: "urgent",
          label: "Mark as urgent",
          type: "checkbox",
          required: false,
          width: "full",
        },
      ],
      workflowSteps: [
        {
          id: nid(),
          name: "Manager approval",
          type: "approval",
          description: "Single approval gate.",
          assigneeRoleId: "role-approver",
          allowEdit: true,
          allowComment: true,
          allowUpload: false,
          canRequestChanges: false,
          declineAction: "end",
          notifyOnEnter: [
            notify("role-approver", "A request needs your approval."),
          ],
          notifyOnComplete: [
            notify("role-submitter", "Your request was approved."),
            notify("role-payroll", "FYI — a request was approved."),
          ],
        },
      ],
    };
  }

  // blank
  return {
    ...base,
    roles: defaultRoles().slice(0, 3),
    formFields: [
      {
        id: "title",
        label: "Title",
        type: "text",
        required: true,
      },
    ],
    workflowSteps: [
      {
        id: nid(),
        name: "Approval",
        type: "approval",
        description: "Configure this step to match the client.",
        assigneeRoleId: "role-approver",
        allowEdit: true,
        allowComment: true,
        allowUpload: false,
        canRequestChanges: false,
        declineAction: "end",
        notifyOnEnter: [
          notify("role-approver", "A new request needs approval."),
        ],
        notifyOnComplete: [
          notify("role-submitter", "Your request was approved."),
        ],
      },
    ],
  };
}

export function cloneClientRecord(source: Client, newName: string): Client {
  const now = new Date().toISOString();
  const id = nanoid(8);
  return {
    ...structuredClone(source),
    id,
    name: newName.trim() || `${source.name} copy`,
    slug: `${source.slug}-copy-${id.slice(0, 4)}`,
    createdAt: now,
    updatedAt: now,
    formFields: structuredClone(source.formFields).map((f) => ({
      ...f,
      id: f.type === "section" ? `section_${nanoid(6)}` : nanoid(8),
    })),
    workflowSteps: structuredClone(source.workflowSteps).map((s) => ({
      ...s,
      id: nanoid(8),
      notifyOnEnter: s.notifyOnEnter.map((n) => ({ ...n, id: nanoid(6) })),
      notifyOnComplete: s.notifyOnComplete.map((n) => ({
        ...n,
        id: nanoid(6),
      })),
    })),
  };
}
