import { Check, Circle, FileText, PenLine, Send, Stamp } from "lucide-react";
import type { ContractRequest, WorkflowStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { stepTypeLabel } from "@/lib/workflow";

const icons = {
  approval: Stamp,
  task: PenLine,
  document_review: FileText,
  issue: Send,
  signed: Check,
};

export function WorkflowTimeline({
  request,
  compact = false,
}: {
  request: ContractRequest;
  compact?: boolean;
}) {
  return (
    <ol className={cn("relative space-y-0", compact && "space-y-0")}>
      {request.workflowSteps.map((step, index) => {
        const done =
          request.status === "completed" ||
          (request.status === "declined"
            ? index < request.currentStepIndex
            : index < request.currentStepIndex);
        const current =
          request.status === "in_progress" &&
          index === request.currentStepIndex;
        const Icon = icons[step.type] ?? Circle;

        return (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {index < request.workflowSteps.length - 1 ? (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-18px)] w-px origin-top",
                  done || current ? "bg-brand/50" : "bg-line",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border",
                done && "border-brand bg-brand text-white",
                current && "border-brand bg-brand-soft text-brand-deep shadow-[0_0_0_4px_var(--brand-soft)]",
                !done && !current && "border-line bg-white text-muted",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{step.name}</p>
                <span className="badge bg-paper-2 text-muted">
                  {stepTypeLabel(step.type)}
                </span>
                {current ? (
                  <span className="badge bg-accent-soft text-accent">Current</span>
                ) : null}
              </div>
              {!compact && step.description ? (
                <p className="mt-1 text-sm text-muted">{step.description}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function WorkflowPreview({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li
          key={step.id}
          className="flex items-start gap-3 rounded-2xl border border-line bg-white/70 p-3"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-deep">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold">{step.name}</p>
            <p className="text-xs text-muted">
              {stepTypeLabel(step.type)}
              {step.description ? ` · ${step.description}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
