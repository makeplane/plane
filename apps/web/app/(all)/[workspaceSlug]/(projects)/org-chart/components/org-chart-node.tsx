import { useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { cn } from "@plane/utils";
import type { IOrgChartDepartment } from "@/plane-web/services/org-chart.service";

type Props = {
  department: IOrgChartDepartment;
};

export function OrgChartNode({ department }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = department.children && department.children.length > 0;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-3 py-2 hover:bg-surface-2",
          department.is_linked && "border-blue-500 border-l-2"
        )}
      >
        {/* Expand/collapse toggle */}
        <button
          type="button"
          className={cn("flex-shrink-0 rounded p-0.5 transition-transform", hasChildren ? "visible" : "invisible")}
          onClick={() => setIsExpanded((v) => !v)}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 text-tertiary transition-transform", isExpanded && "rotate-90")} />
        </button>

        {/* Department info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm truncate font-medium text-primary">{department.name}</span>
              <span className="text-xs text-tertiary">({department.code})</span>
              <span className="text-xs bg-surface-3 rounded px-1.5 py-0.5 text-secondary">L{department.level}</span>
              {department.is_linked && (
                <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 rounded px-1.5 py-0.5">
                  {department.linked_workspace_detail?.name ?? "Linked"}
                </span>
              )}
            </div>
            {department.manager_detail && (
              <p className="text-xs mt-0.5 text-tertiary">Manager: {department.manager_detail.display_name}</p>
            )}
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1 text-tertiary">
            <Users className="h-3.5 w-3.5" />
            <span className="text-xs">{department.staff_count}</span>
          </div>
        </div>
      </div>

      {/* Recursive children */}
      {hasChildren && isExpanded && (
        <div className="mt-0.5 ml-6 flex flex-col gap-0.5 border-l border-subtle pl-2">
          {department.children.map((child) => (
            <OrgChartNode key={child.id} department={child} />
          ))}
        </div>
      )}
    </div>
  );
}
