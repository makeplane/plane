import { FC, useCallback } from "react";
// constants
import { observer } from "mobx-react";
import { EIssueFilterType, EIssueServiceType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
// types
import {
  IIssueDisplayFilterOptions,
  TIssueServiceType,
  IIssueDisplayProperties,
  IIssueFilterOptions,
} from "@plane/types";
// components
import { SubIssuesActionButton, SubIssueDisplayFilters } from "@/components/issues/issue-detail-widgets/sub-issues";
import { SubIssueFilters } from "@/components/issues/issue-detail-widgets/sub-issues/filters";
import { useIssueDetail, useMember, useProjectState } from "@/hooks/store";

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
      filters: { getSubIssueFilters, updateSubWorkItemFilters },
    },
  } = useIssueDetail(workItemServiceType);

  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds },
  } = useMember();

  // derived values
  const projectMemberIds = getProjectMemberIds(projectId, false);
  const projectStates = getProjectStates(projectId);
  const subIssueFilters = getSubIssueFilters(workItemId);
  // handlers
  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, workItemId);
    },
    [workspaceSlug, projectId, updateSubWorkItemFilters, workItemId]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_PROPERTIES, updatedDisplayProperties, workItemId);
    },
    [workspaceSlug, projectId, updateSubWorkItemFilters, workItemId]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      if (!workspaceSlug || !projectId) return;
      const newValues = subIssueFilters?.filters?.[key] ?? [];

      if (Array.isArray(value)) {
        // this validation is majorly for the filter start_date, target_date custom
        value.forEach((val) => {
          if (!newValues.includes(val)) newValues.push(val);
          else newValues.splice(newValues.indexOf(val), 1);
        });
      } else {
        if (subIssueFilters?.filters?.[key]?.includes(value)) newValues.splice(newValues.indexOf(value), 1);
        else newValues.push(value);
      }

      updateSubWorkItemFilters(EIssueFilterType.FILTERS, { [key]: newValues }, workItemId);
    },
    [workspaceSlug, projectId, subIssueFilters?.filters, updateSubWorkItemFilters, workItemId]
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
      <SubIssueFilters
        handleFiltersUpdate={handleFiltersUpdate}
        filters={subIssueFilters?.filters ?? {}}
        memberIds={projectMemberIds ?? undefined}
        states={projectStates}
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
      />
      <SubIssuesActionButton issueId={workItemId} issueServiceType={workItemServiceType} disabled={disabled} />
    </div>
  );
});
