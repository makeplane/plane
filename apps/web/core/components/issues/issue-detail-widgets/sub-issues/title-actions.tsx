import type { FC } from "react";
import { useCallback } from "react";
import { cloneDeep } from "lodash-es";
import { observer } from "mobx-react";
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_WORK_ITEM_PAGE,
} from "@plane/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilterOptions,
  TIssueServiceType,
} from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { SubIssueDisplayFilters } from "./display-filters";
import { SubIssueFilters } from "./filters";
import { SubIssuesActionButton } from "./quick-action-button";

type TSubWorkItemTitleActionsProps = {
  disabled: boolean;
  issueServiceType?: TIssueServiceType;
  parentId: string;
  projectId: string;
};

export const SubWorkItemTitleActions = observer(function SubWorkItemTitleActions(props: TSubWorkItemTitleActionsProps) {
  const { disabled, issueServiceType = EIssueServiceType.ISSUES, parentId, projectId } = props;

  // store hooks
  const {
    subIssues: {
      filters: { getSubIssueFilters, updateSubWorkItemFilters },
    },
  } = useIssueDetail(issueServiceType);
  const { getProjectStates } = useProjectState();
  const {
    project: { getProjectMemberIds },
  } = useMember();

  // derived values
  const projectStates = getProjectStates(projectId);
  const projectMemberIds = getProjectMemberIds(projectId, false);
  const subIssueFilters = getSubIssueFilters(parentId);
  const layoutDisplayFiltersOptions = ISSUE_DISPLAY_FILTERS_BY_PAGE["sub_work_items"].layoutOptions.list;

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, parentId);
    },
    [updateSubWorkItemFilters, parentId]
  );

  const handleDisplayPropertiesUpdate = useCallback(
    (updatedDisplayProperties: Partial<IIssueDisplayProperties>) => {
      updateSubWorkItemFilters(EIssueFilterType.DISPLAY_PROPERTIES, updatedDisplayProperties, parentId);
    },
    [updateSubWorkItemFilters, parentId]
  );

  const handleFiltersUpdate = useCallback(
    (key: keyof IIssueFilterOptions, value: string | string[]) => {
      const newValues = cloneDeep(subIssueFilters?.filters?.[key]) ?? [];

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
      updateSubWorkItemFilters(EIssueFilterType.FILTERS, { [key]: newValues }, parentId);
    },
    [subIssueFilters?.filters, updateSubWorkItemFilters, parentId]
  );

  return (
    // prevent click everywhere
    <div
      className="flex gap-2 items-center"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
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
        memberIds={projectMemberIds ?? undefined}
        states={projectStates}
        availableFilters={SUB_WORK_ITEM_AVAILABLE_FILTERS_FOR_WORK_ITEM_PAGE}
      />
      {!disabled && (
        <SubIssuesActionButton issueId={parentId} disabled={disabled} issueServiceType={issueServiceType} />
      )}
    </div>
  );
});
