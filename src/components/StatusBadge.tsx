import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/types";

const map: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-paper-2 text-ink-soft" },
  in_progress: {
    label: "In progress",
    className: "bg-brand-soft text-brand-deep",
  },
  declined: { label: "Declined", className: "bg-danger-soft text-danger" },
  completed: { label: "Completed", className: "bg-success-soft text-success" },
  cancelled: { label: "Cancelled", className: "bg-paper-2 text-muted" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus;
  className?: string;
}) {
  const meta = map[status];
  return (
    <span className={cn("badge", meta.className, className)}>{meta.label}</span>
  );
}
