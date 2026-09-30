import type { AppStore, Client, User } from "./types";

const now = () => new Date().toISOString();

export const CLIENT_A_ID = "client-a";
export const CLIENT_B_ID = "client-b";

export function createSeedStore(): AppStore {
  const users: User[] = [
    {
      id: "user-admin",
      name: "Alex Morgan",
      email: "alex@northline.team",
      title: "Platform Admin",
      isAdmin: true,
      clientRoles: {
        [CLIENT_A_ID]: ["role-contracts"],
        [CLIENT_B_ID]: ["role-hr"],
      },
    },
    {
      id: "user-submitter",
      name: "Jordan Lee",
      email: "jordan@clienta.com",
      title: "Hiring Manager",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-submitter"],
      },
    },
    {
      id: "user-approver",
      name: "Sam Rivera",
      email: "sam@clienta.com",
      title: "People Lead",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-approver"],
      },
    },
    {
      id: "user-payroll",
      name: "Casey Nguyen",
      email: "casey@northline.team",
      title: "Payroll Specialist",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-payroll"],
        [CLIENT_B_ID]: ["role-payroll"],
      },
    },
    {
      id: "user-contracts",
      name: "Riley Brooks",
      email: "riley@northline.team",
      title: "Contracts Associate",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-contracts"],
        [CLIENT_B_ID]: ["role-contracts"],
      },
    },
    {
      id: "user-legal",
      name: "Taylor Quinn",
      email: "taylor@northline.team",
      title: "Legal Counsel",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-legal"],
      },
    },
    {
      id: "user-employee",
      name: "Morgan Blake",
      email: "morgan.blake@email.com",
      title: "Incoming Employee",
      isAdmin: false,
      clientRoles: {
        [CLIENT_A_ID]: ["role-employee"],
      },
    },
    {
      id: "user-b-submitter",
      name: "Priya Shah",
      email: "priya@clientb.com",
      title: "Talent Partner",
      isAdmin: false,
      clientRoles: {
        [CLIENT_B_ID]: ["role-submitter"],
      },
    },
    {
      id: "user-b-approver",
      name: "Chris Okonkwo",
      email: "chris@clientb.com",
      title: "Finance Director",
      isAdmin: false,
      clientRoles: {
        [CLIENT_B_ID]: ["role-approver"],
      },
    },
  ];

  const clientA: Client = {
    id: CLIENT_A_ID,
    name: "Client A",
    slug: "client-a",
    description:
      "New hire offer → approval → contract draft → review loop → issue → signed.",
    accent: "#1F6F6B",
    roles: [
      {
        id: "role-submitter",
        name: "Requester",
        description: "Submits new contract requests",
        color: "#3D6B8C",
      },
      {
        id: "role-approver",
        name: "Approver",
        description: "Reviews and approves offer details",
        color: "#C46B3A",
      },
      {
        id: "role-payroll",
        name: "Payroll",
        description: "Notified of new offers",
        color: "#5B6B4A",
      },
      {
        id: "role-contracts",
        name: "Contracts team",
        description: "Drafts and manages contracts",
        color: "#1F6F6B",
      },
      {
        id: "role-legal",
        name: "Legal",
        description: "Optional contract reviewers",
        color: "#5C4E7A",
      },
      {
        id: "role-employee",
        name: "Employee",
        description: "Receives contract for signature",
        color: "#6B5B4A",
      },
    ],
    formFields: [
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
        placeholder: "morgan@email.com",
      },
      {
        id: "job_title",
        label: "Job title",
        type: "text",
        required: true,
        placeholder: "Product Designer",
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
        label: "Proposed start date",
        type: "date",
        required: true,
      },
      {
        id: "salary",
        label: "Annual salary",
        type: "currency",
        required: true,
        helpText: "Base salary before benefits",
      },
      {
        id: "contract_type",
        label: "Contract type",
        type: "select",
        required: true,
        options: ["Permanent", "Fixed term", "Contractor"],
      },
      {
        id: "notes",
        label: "Additional notes",
        type: "textarea",
        required: false,
        placeholder: "Anything the approver should know…",
      },
    ],
    workflowSteps: [
      {
        id: "step-approve",
        name: "Approver review",
        type: "approval",
        description:
          "Approver can edit details, leave comments, then approve or decline.",
        assigneeRoleId: "role-approver",
        allowEdit: true,
        allowComment: true,
        allowUpload: false,
        canRequestChanges: false,
        notifyOnEnter: [
          {
            id: "n1",
            roleId: "role-approver",
            message: "A new contract request is waiting for your review.",
          },
        ],
        notifyOnComplete: [
          {
            id: "n2",
            roleId: "role-submitter",
            message: "Your request was approved and is moving to contract drafting.",
          },
          {
            id: "n3",
            roleId: "role-payroll",
            message: "New offer approved — please prepare payroll onboarding.",
          },
          {
            id: "n4",
            roleId: "role-contracts",
            message: "Please draft the contract for this approved offer.",
          },
        ],
      },
      {
        id: "step-draft",
        name: "Draft contract",
        type: "task",
        description: "Contracts team drafts the Word contract and uploads it.",
        assigneeRoleId: "role-contracts",
        allowEdit: false,
        allowComment: true,
        allowUpload: true,
        canRequestChanges: false,
        notifyOnEnter: [
          {
            id: "n5",
            roleId: "role-contracts",
            message: "Contract drafting is ready for you.",
          },
        ],
        notifyOnComplete: [],
      },
      {
        id: "step-review",
        name: "Contract review",
        type: "document_review",
        description:
          "Send the draft to reviewers. They can approve or request changes — you can go back and forth.",
        assigneeRoleId: "role-legal",
        allowEdit: false,
        allowComment: true,
        allowUpload: true,
        canRequestChanges: true,
        notifyOnEnter: [
          {
            id: "n6",
            roleId: "role-legal",
            message: "A contract is ready for your review.",
          },
        ],
        notifyOnComplete: [
          {
            id: "n7",
            roleId: "role-contracts",
            message: "Contract review is complete — ready to issue.",
          },
        ],
      },
      {
        id: "step-issue",
        name: "Issue to employee",
        type: "issue",
        description: "Send the approved contract to the employee for signature.",
        assigneeRoleId: "role-contracts",
        allowEdit: false,
        allowComment: true,
        allowUpload: false,
        canRequestChanges: false,
        notifyOnEnter: [],
        notifyOnComplete: [
          {
            id: "n8",
            roleId: "role-employee",
            message: "Your contract is ready to sign.",
          },
        ],
      },
      {
        id: "step-signed",
        name: "Confirm signed",
        type: "signed",
        description:
          "Once the signed contract is back, confirm and notify everyone relevant.",
        assigneeRoleId: "role-contracts",
        allowEdit: false,
        allowComment: true,
        allowUpload: true,
        canRequestChanges: false,
        notifyOnEnter: [
          {
            id: "n9",
            roleId: "role-contracts",
            message: "Waiting for signed contract confirmation.",
          },
        ],
        notifyOnComplete: [
          {
            id: "n10",
            roleId: "role-submitter",
            message: "The contract has been signed and returned.",
          },
          {
            id: "n11",
            roleId: "role-approver",
            message: "The contract has been signed and returned.",
          },
          {
            id: "n12",
            roleId: "role-payroll",
            message: "Signed contract received — you can finalise onboarding.",
          },
        ],
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };

  const clientB: Client = {
    id: CLIENT_B_ID,
    name: "Client B",
    slug: "client-b",
    description: "Simpler two-step approval then issue — shows per-client workflows.",
    accent: "#3D6B8C",
    roles: [
      {
        id: "role-submitter",
        name: "Requester",
        color: "#3D6B8C",
      },
      {
        id: "role-approver",
        name: "Finance approver",
        color: "#C46B3A",
      },
      {
        id: "role-hr",
        name: "HR",
        color: "#5B6B4A",
      },
      {
        id: "role-contracts",
        name: "Contracts",
        color: "#1F6F6B",
      },
      {
        id: "role-payroll",
        name: "Payroll",
        color: "#6B5B4A",
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
        id: "justification",
        label: "Business justification",
        type: "textarea",
        required: true,
      },
    ],
    workflowSteps: [
      {
        id: "step-b-approve",
        name: "Finance approval",
        type: "approval",
        description: "Finance reviews rate and justification.",
        assigneeRoleId: "role-approver",
        allowEdit: true,
        allowComment: true,
        allowUpload: false,
        canRequestChanges: false,
        notifyOnEnter: [
          {
            id: "nb1",
            roleId: "role-approver",
            message: "A Client B request needs finance approval.",
          },
        ],
        notifyOnComplete: [
          {
            id: "nb2",
            roleId: "role-hr",
            message: "Approved — please prepare paperwork.",
          },
          {
            id: "nb3",
            roleId: "role-contracts",
            message: "Approved — please issue the agreement.",
          },
        ],
      },
      {
        id: "step-b-issue",
        name: "Issue agreement",
        type: "issue",
        description: "Contracts issues the agreement to the worker.",
        assigneeRoleId: "role-contracts",
        allowEdit: false,
        allowComment: true,
        allowUpload: true,
        canRequestChanges: false,
        notifyOnEnter: [],
        notifyOnComplete: [
          {
            id: "nb4",
            roleId: "role-submitter",
            message: "Agreement has been issued.",
          },
          {
            id: "nb5",
            roleId: "role-payroll",
            message: "Agreement issued for a Client B engagement.",
          },
        ],
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  };

  return {
    users,
    clients: [clientA, clientB],
    requests: [],
    notifications: [],
    currentUserId: "user-submitter",
  };
}
