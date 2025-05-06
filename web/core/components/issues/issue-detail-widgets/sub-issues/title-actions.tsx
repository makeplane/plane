import { FC, useCallback } from "react";
import { observer } from "mobx-react";
import { EIssueFilterType, EIssueServiceType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store";
import { SubIssueDisplayFilters } from "./display-filters";
import { SubIssuesActionButton } from "./quick-action-button";

type TSubWorkItemTitleActionsProps = {
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
  parentId: string;
  workspaceSlug: string;
  projectId: string;
};

export const SubWorkItemTitleActions: FC<TSubWorkItemTitleActionsProps> = observer((props) => {
  const { disabled, issueServiceType = EIssueServiceType.ISSUES, parentId, workspaceSlug, projectId } = props;

  // store hooks
  const {
    subIssues: {
      filters: { getSubIssueFilters, updateSubIssueFilters },
    },
  } = useIssueDetail(issueServiceType);

  // derived values
  const subIssueFilters = getSubIssueFilters(parentId);

  const layoutDisplayFiltersOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE["sub_work_items"].list;

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubIssueFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, parentId);
    },
    [workspaceSlug, projectId, parentId, updateSubIssueFilters]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubIssueFilters(
        workspaceSlug,
        projectId,
        EIssueFilterType.DISPLAY_PROPERTIES,
        updatedDisplayProperties,
        parentId
      );
    },
    [workspaceSlug, projectId, parentId, updateSubIssueFilters]
  );

  return (
    <div className="flex items-center gap-2">
      <SubIssueDisplayFilters
        isEpic={issueServiceType === EIssueServiceType.EPICS}
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
        displayProperties={subIssueFilters?.displayProperties ?? {}}
        displayFilters={subIssueFilters?.displayFilters ?? {}}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
      {!disabled && (
        <SubIssuesActionButton issueId={parentId} disabled={disabled} issueServiceType={issueServiceType} />
      )}
    </div>
  );
});
