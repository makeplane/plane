import { FC, useCallback } from "react";
import { observer } from "mobx-react";
import { EIssueFilterType, EIssueServiceType, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssueServiceType,
} from "@plane/types";
import { useIssueDetail, useMember, useProjectState } from "@/hooks/store";
import { SubIssueDisplayFilters } from "./display-filters";
import { SubIssueFilters } from "./filters";
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
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds },
  } = useMember();

  // derived values
  const subIssueFilters = getSubIssueFilters(parentId);
  const projectStates = getProjectStates(projectId);
  const projectMemberIds = getProjectMemberIds(projectId, false);

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

      updateSubIssueFilters(
        workspaceSlug.toString(),
        projectId.toString(),
        EIssueFilterType.FILTERS,
        { [key]: newValues },
        parentId
      );
    },
    [workspaceSlug, projectId, subIssueFilters?.filters, updateSubIssueFilters, parentId]
  );

  return (
    <div className="flex gap-2">
      <SubIssueDisplayFilters
        isEpic={issueServiceType === EIssueServiceType.EPICS}
        layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
        displayProperties={subIssueFilters?.displayProperties ?? {}}
        displayFilters={subIssueFilters?.displayFilters ?? {}}
        handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
        handleDisplayFiltersUpdate={handleDisplayFilters}
      />
      <SubIssueFilters
        handleFiltersUpdate={handleFiltersUpdate}
        filters={subIssueFilters?.filters ?? {}}
        projectMemberIds={projectMemberIds ?? undefined}
        projectStates={projectStates}
      />
      {!disabled && (
        <SubIssuesActionButton issueId={parentId} disabled={disabled} issueServiceType={issueServiceType} />
      )}
    </div>
  );
});
