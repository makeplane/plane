import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@plane/utils";
import { getButtonStyling } from "@plane/propel/button";
import type { IInstanceDepartment } from "@plane/services";

type Props = {
  dept: IInstanceDepartment;
  depth?: number;
};

export function HoDepartmentTreeRow({ dept, depth = 0 }: Props) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = !!dept.children?.length;

  return (
    <>
      <tr className="border-b border-subtle hover:bg-custom-background-90 transition-colors">
        <td className="py-2.5 pr-4" style={{ paddingLeft: `${depth * 20 + 12}px` }}>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className={cn("w-4 h-4 flex-shrink-0 text-placeholder", !hasChildren && "invisible")}
            >
              <ChevronRight className={cn("w-4 h-4 transition-transform", expanded && "rotate-90")} />
            </button>
            <span className="font-medium text-sm text-custom-text-100">{dept.name}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-sm">
          {dept.linked_workspace_detail ? (
            <a
              href={`/${dept.linked_workspace_detail.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("inline-flex items-center", getButtonStyling("secondary", "sm"))}
            >
              {dept.linked_workspace_detail.name}
            </a>
          ) : (
            <span className="text-custom-text-400">—</span>
          )}
        </td>
      </tr>
      {hasChildren && expanded &&
        dept.children!.map((child) => (
          <HoDepartmentTreeRow key={child.id} dept={child} depth={depth + 1} />
        ))}
    </>
  );
}
