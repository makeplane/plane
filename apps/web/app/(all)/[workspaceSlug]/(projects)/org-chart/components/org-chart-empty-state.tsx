import { Network } from "lucide-react";

export function OrgChartEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-4">
      <div className="rounded-full bg-surface-2 p-4">
        <Network className="h-10 w-10 text-tertiary" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-primary">No departments linked</h3>
        <p className="mt-1 text-sm text-tertiary max-w-sm">
          No departments are linked to this workspace. Ask your admin to link departments in God-mode settings.
        </p>
      </div>
    </div>
  );
}
