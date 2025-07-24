import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight, CircleDashed } from "lucide-react";
import { ALL_ISSUES } from "@plane/constants";
import { EIssuesStoreType, IGroupByColumn, TIssue, TIssueServiceType, TSubIssueOperations } from "@plane/types";
import { Collapsible } from "@plane/ui";
import { cn } from "@plane/utils";
import { SubIssuesListItem } from "./list-item";

interface TSubIssuesListGroupProps {
  workItemIds: string[];
  projectId: string;
  workspaceSlug: string;
  group: IGroupByColumn;
  serviceType: TIssueServiceType;
  disabled: boolean;
  parentIssueId: string;
  rootIssueId: string;
  handleIssueCrudState: (
    key: "create" | "existing" | "update" | "delete",
    issueId: string,
    issue?: TIssue | null
  ) => void;
  subIssueOperations: TSubIssueOperations;
  storeType?: EIssuesStoreType;
  spacingLeft?: number;
}

export const SubIssuesListGroup: FC<TSubIssuesListGroupProps> = observer((props) => {
  const {
    group,
    serviceType,
    disabled,
    parentIssueId,
    rootIssueId,
    projectId,
    workspaceSlug,
    handleIssueCrudState,
    subIssueOperations,
    workItemIds,
    storeType = EIssuesStoreType.PROJECT,
    spacingLeft = 0,
  } = props;

  const isAllIssues = group.id === ALL_ISSUES;

  // states
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true);

  if (!workItemIds.length) return null;

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
              <span className="text-sm text-custom-text-400">{workItemIds.length}</span>
            </div>
          )
        }
        buttonClassName={cn("hidden", !isAllIssues && "block")}
      >
        {/* Work items list */}
        <div className="pl-2">
          {workItemIds?.map((workItemId) => (
            <SubIssuesListItem
              key={workItemId}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              parentIssueId={parentIssueId}
              rootIssueId={rootIssueId}
              issueId={workItemId}
              disabled={disabled}
              handleIssueCrudState={handleIssueCrudState}
              subIssueOperations={subIssueOperations}
              issueServiceType={serviceType}
              spacingLeft={spacingLeft}
              storeType={storeType}
            />
          ))}
        </div>
      </Collapsible>
    </>
  );
});
