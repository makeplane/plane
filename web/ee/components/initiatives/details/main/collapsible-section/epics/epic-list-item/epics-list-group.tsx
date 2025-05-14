import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight, CircleDashed } from "lucide-react";
import { ALL_ISSUES } from "@plane/constants";
import { IGroupByColumn } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { cn } from "@plane/utils";
import { EpicListItem } from "./root";

interface TEpicsGroupProps {
  epicIds: string[];
  workspaceSlug: string;
  group: IGroupByColumn;
  disabled: boolean;
  initiativeId: string;
}

export const EpicsGroup: FC<TEpicsGroupProps> = observer((props) => {
  const { group, disabled, initiativeId, workspaceSlug, epicIds } = props;

  const isAllIssues = group.id === ALL_ISSUES;

  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(isAllIssues);

  if (!epicIds.length) return null;

  return (
    <>
      <Collapsible
        isOpen={isCollapsibleOpen}
        onToggle={() => setIsCollapsibleOpen(!isCollapsibleOpen)}
        title={
          !isAllIssues && (
            <div className="flex items-center gap-2 p-3">
              <ChevronRight
                className={cn("size-3.5 transition-all text-custom-text-400", {
                  "rotate-90": isCollapsibleOpen,
                })}
                strokeWidth={2.5}
              />
              <div className="flex-shrink-0 grid place-items-center overflow-hidden">
                {group.icon ?? <CircleDashed className="size-3.5" strokeWidth={2} />}
              </div>
              <span className="text-sm text-custom-text-100 font-medium">{group.name}</span>
              <span className="text-sm text-custom-text-400">{epicIds.length}</span>
            </div>
          )
        }
        buttonClassName={cn("hidden", !isAllIssues && "block")}
      >
        {/* Epics list */}
        <div className="pl-2">
          {epicIds?.map((epicId) => (
            <EpicListItem
              key={epicId}
              workspaceSlug={workspaceSlug}
              epicId={epicId}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          ))}
        </div>
      </Collapsible>
    </>
  );
});
