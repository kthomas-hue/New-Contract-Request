/**
 * End-to-end workflow smoke test against the JSON store + workflow helpers.
 * Run: npx tsx scripts/e2e-workflow.ts
 */
import { resetStore, readStore, updateStore } from "../src/lib/db";
import {
  addActivity,
  currentStep,
  nextReference,
  pushNotifications,
  resolveNotifyRecipients,
  resolveStepAssignees,
  usersForRole,
} from "../src/lib/workflow";
import { nanoid } from "nanoid";
import type { ContractRequest } from "../src/lib/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function setUser(userId: string) {
  await updateStore((s) => ({ ...s, currentUserId: userId }));
}

async function main() {
  await resetStore();
  let store = await readStore();
  const client = store.clients.find((c) => c.slug === "client-a");
  assert(client, "Client A missing");

  // 1. Submit as Jordan
  await setUser("user-submitter");
  store = await readStore();
  const firstStep = client.workflowSteps[0];
  const request: ContractRequest = {
    id: nanoid(10),
    reference: nextReference(store),
    clientId: client.id,
    title: "Morgan Blake — Client A",
    status: "in_progress",
    currentStepIndex: 0,
    workflowSteps: structuredClone(client.workflowSteps),
    formFields: structuredClone(client.formFields),
    formData: {
      candidate_name: "Morgan Blake",
      candidate_email: "morgan@email.com",
      job_title: "Product Designer",
      department: "Design",
      start_date: "2026-11-01",
      salary: 72000,
      contract_type: "Permanent",
      notes: "Strong portfolio",
    },
    submitterId: "user-submitter",
    currentAssigneeIds: resolveStepAssignees(store, client.id, firstStep),
    documents: [],
    activity: [],
    signedNotifyUserIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  addActivity(request, {
    kind: "submitted",
    userId: "user-submitter",
    stepId: firstStep.id,
    message: "submitted",
  });
  pushNotifications(
    store,
    resolveNotifyRecipients(store, client.id, firstStep.notifyOnEnter, request),
    "enter",
    "Approver review",
    request.id,
  );
  store.requests.unshift(request);
  await updateStore(() => store);

  assert(
    request.currentAssigneeIds.includes("user-approver"),
    "Approver should be assigned",
  );
  assert(
    store.notifications.some((n) => n.userId === "user-approver"),
    "Approver notified on enter",
  );

  // 2. Approve as Sam — should notify submitter, payroll, contracts
  await setUser("user-approver");
  store = await readStore();
  const req = store.requests[0];
  addActivity(req, {
    kind: "approved",
    userId: "user-approver",
    stepId: currentStep(req)!.id,
    message: "approved",
  });
  const completeRecipients = resolveNotifyRecipients(
    store,
    client.id,
    currentStep(req)!.notifyOnComplete,
    req,
  );
  pushNotifications(store, completeRecipients, "approved", "done", req.id);
  req.currentStepIndex = 1;
  req.currentAssigneeIds = resolveStepAssignees(
    store,
    client.id,
    req.workflowSteps[1],
  );
  req.updatedAt = new Date().toISOString();
  await updateStore(() => store);

  store = await readStore();
  const afterApprove = store.notifications;
  assert(
    afterApprove.some((n) => n.userId === "user-submitter"),
    "Submitter notified",
  );
  assert(
    afterApprove.some((n) => n.userId === "user-payroll"),
    "Payroll notified",
  );
  assert(
    afterApprove.some((n) => n.userId === "user-contracts"),
    "Contracts notified",
  );
  assert(
    store.requests[0].currentAssigneeIds.includes("user-contracts"),
    "Contracts assigned to draft",
  );

  // 3. Draft complete
  const r = store.requests[0];
  r.documents.unshift({
    id: nanoid(8),
    name: "Offer.docx",
    fileName: "Offer.docx",
    uploadedById: "user-contracts",
    uploadedAt: new Date().toISOString(),
  });
  r.currentStepIndex = 2;
  r.currentAssigneeIds = resolveStepAssignees(
    store,
    client.id,
    r.workflowSteps[2],
  );
  await updateStore(() => store);

  // 4. Changes requested then re-approve
  store = await readStore();
  const review = store.requests[0];
  assert(
    review.currentAssigneeIds.includes("user-legal"),
    "Legal assigned for review",
  );
  // request changes -> contracts
  const contracts = usersForRole(store, client.id, "role-contracts").map(
    (u) => u.id,
  );
  review.currentAssigneeIds = contracts;
  await updateStore(() => store);

  store = await readStore();
  store.requests[0].documents.unshift({
    id: nanoid(8),
    name: "Offer-v2.docx",
    fileName: "Offer-v2.docx",
    uploadedById: "user-contracts",
    uploadedAt: new Date().toISOString(),
  });
  store.requests[0].currentAssigneeIds = resolveStepAssignees(
    store,
    client.id,
    store.requests[0].workflowSteps[2],
  );
  // approve review -> issue
  store.requests[0].currentStepIndex = 3;
  store.requests[0].currentAssigneeIds = resolveStepAssignees(
    store,
    client.id,
    store.requests[0].workflowSteps[3],
  );
  await updateStore(() => store);

  // 5. Issue -> signed
  store = await readStore();
  store.requests[0].currentStepIndex = 4;
  store.requests[0].currentAssigneeIds = resolveStepAssignees(
    store,
    client.id,
    store.requests[0].workflowSteps[4],
  );
  await updateStore(() => store);

  store = await readStore();
  const signedStep = store.requests[0].workflowSteps[4];
  const signedRecipients = resolveNotifyRecipients(
    store,
    client.id,
    signedStep.notifyOnComplete,
    store.requests[0],
  );
  pushNotifications(
    store,
    signedRecipients,
    "signed",
    "Contract signed",
    store.requests[0].id,
  );
  store.requests[0].status = "completed";
  store.requests[0].completedAt = new Date().toISOString();
  store.requests[0].currentAssigneeIds = [];
  await updateStore(() => store);

  store = await readStore();
  assert(store.requests[0].status === "completed", "Should be completed");
  assert(
    store.notifications.some(
      (n) => n.userId === "user-submitter" && n.title.includes("signed"),
    ),
    "Submitter got signed notice",
  );
  assert(
    store.notifications.some(
      (n) => n.userId === "user-approver" && n.title.includes("signed"),
    ),
    "Approver got signed notice",
  );
  assert(store.requests[0].documents.length >= 2, "Revision history kept");

  console.log("E2E workflow smoke test passed");
  console.log(
    JSON.stringify(
      {
        reference: store.requests[0].reference,
        status: store.requests[0].status,
        steps: store.requests[0].workflowSteps.length,
        documents: store.requests[0].documents.map((d) => d.fileName),
        notificationCount: store.notifications.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
