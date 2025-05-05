import { FC, useCallback } from "react";
// constants
import { observer } from "mobx-react";
import { EIssueFilterType, EIssueServiceType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// types
import { IIssueDisplayFilterOptions, TIssueServiceType, IIssueDisplayProperties } from "@plane/types";
// components
import { SubIssuesActionButton, SubIssueDisplayFilters } from "@/components/issues/issue-detail-widgets/sub-issues";
import { useIssueDetail } from "@/hooks/store";

type TSubWorkItemsActionsProps = {
  workItemId: string;
  workItemServiceType: TIssueServiceType;
  disabled?: boolean;
  projectId: string;
  workspaceSlug: string;
};

export const SubWorkItemsActions: FC<TSubWorkItemsActionsProps> = observer((props) => {
  const { workItemId, workItemServiceType, disabled, projectId, workspaceSlug } = props;

  // store hooks
  const {
    subIssues: {
      filters: { getSubIssueFilters, updateSubIssueFilters },
    },
  } = useIssueDetail(workItemServiceType);

  // derived values
  const subIssueFilters = getSubIssueFilters(workItemId);

  // handlers
  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubIssueFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.DISPLAY_FILTERS,
        updatedDisplayFilter,
        workItemId
      );
    },
    [workspaceSlug, projectId, updateSubIssueFilters, workItemId]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubIssueFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.DISPLAY_PROPERTIES,
        updatedDisplayProperties,
        workItemId
      );
    },
    [workspaceSlug, projectId, updateSubIssueFilters, workItemId]
  );

  const layoutDisplayFiltersOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE["sub_work_items"]?.["list"];

  return (
    <div className="flex items-center gap-2">
      <SubIssueDisplayFilters
        isEpic={workItemServiceType === EIssueServiceType.EPICS}
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
        displayProperties={subIssueFilters?.displayProperties ?? {}}
        displayFilters={subIssueFilters?.displayFilters ?? {}}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
      <SubIssuesActionButton issueId={workItemId} issueServiceType={workItemServiceType} disabled={disabled} />
    </div>
  );
});
