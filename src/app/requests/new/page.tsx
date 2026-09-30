import { NewRequestForm } from "@/components/NewRequestForm";
import { readStore } from "@/lib/db";

export default async function NewRequestPage() {
  const store = await readStore();

  return (
    <div className="space-y-6">
      <div className="animate-fade">
        <p className="text-sm font-semibold text-brand">New request</p>
        <h1 className="font-display text-3xl tracking-tight">
          Start a contract request
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Pick a client — their form and workflow load automatically.
        </p>
      </div>
      <NewRequestForm clients={store.clients} />
    </div>
  );
}
