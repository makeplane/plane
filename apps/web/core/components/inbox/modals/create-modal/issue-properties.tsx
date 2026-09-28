/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ETabIndices } from "@plane/constants";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { CalendarOutline, ParentOutline } from "@makeplane/propel/icons";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import type { ISearchIssueResponse, TIssue } from "@plane/types";
import { renderFormattedPayloadDate, getDate, getTabIndex } from "@plane/utils";
// components
import { CycleSelect } from "@/components/dropdowns/cycle/cycle-select";
import { EstimateSelect } from "@/components/dropdowns/estimate/estimate-select";
import { IntakeStateSelect } from "@/components/dropdowns/intake-state/intake-state-select";
import { LabelSelect } from "@/components/dropdowns/label/label-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { ModuleSelect } from "@/components/dropdowns/module/module-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { ParentIssuesListModal } from "@/components/issues/parent-issues-list-modal";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useUserProfile } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TInboxIssueProperties = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  isVisible?: boolean;
};

export const InboxIssueProperties = observer(function InboxIssueProperties(props: TInboxIssueProperties) {
  const { workspaceSlug, projectId, data, handleData, isVisible = false } = props;
  // translation
  const { t } = useTranslation();
  // hooks
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { data: userProfile } = useUserProfile();
  const { isMobile } = usePlatformOS();
  // states
  const [parentIssueModalOpen, setParentIssueModalOpen] = useState(false);
  const [selectedParentIssue, setSelectedParentIssue] = useState<ISearchIssueResponse | undefined>(undefined);

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);

  const startDate = data?.start_date;
  const targetDate = data?.target_date;

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {/* intake state */}
      <IntakeStateSelect
        workspaceSlug={workspaceSlug}
        value={data?.state_id}
        onChange={(stateId) => handleData("state_id", stateId)}
        projectId={projectId}
        variant="pill-md"
        tabIndex={getIndex("state_id")}
      />

      {/* priority */}
      <PrioritySelect
        value={data?.priority}
        onChange={(priority) => handleData("priority", priority)}
        variant="pill-md"
        tabIndex={getIndex("priority")}
      />

      {/* Assignees */}
      <MemberSelect
        projectId={projectId}
        value={data?.assignee_ids || []}
        onChange={(assigneeIds) => handleData("assignee_ids", assigneeIds)}
        placeholder="Assignees"
        multiple
        variant={(data?.assignee_ids || []).length ? "avatar-group-md" : "pill-md"}
        tabIndex={getIndex("assignee_ids")}
      />

      {/* labels */}
      <LabelSelect
        projectId={projectId}
        value={data?.label_ids || []}
        onChange={(labelIds) => handleData("label_ids", labelIds)}
        variant="pill-md"
        placeholder={t("labels")}
        tabIndex={getIndex("label_ids")}
      />

      {/* start date */}
      {isVisible && (
        <DateSelect
          value={getDate(data?.start_date) ?? null}
          onChange={(date) => handleData("start_date", date ? renderFormattedPayloadDate(date) : "")}
          minDate={minDate ?? undefined}
          placeholder="Start date"
          icon={<CalendarOutline />}
          weekStartsOn={userProfile?.start_of_the_week}
          clearable
          clearLabel={t("common.clear")}
          variant="pill-md"
          tabIndex={getIndex("start_date")}
        />
      )}

      {/* due date */}
      <DateSelect
        value={getDate(data?.target_date) ?? null}
        onChange={(date) => handleData("target_date", date ? renderFormattedPayloadDate(date) : "")}
        minDate={minDate ?? undefined}
        placeholder="Due date"
        icon={<CalendarOutline />}
        weekStartsOn={userProfile?.start_of_the_week}
        clearable
        clearLabel={t("common.clear")}
        variant="pill-md"
        tabIndex={getIndex("target_date")}
      />

      {/* cycle */}
      {isVisible && (
        <CycleSelect
          value={data?.cycle_id || null}
          onChange={(cycleId) => handleData("cycle_id", cycleId)}
          projectId={projectId}
          placeholder="Cycle"
          variant="pill-md"
          tabIndex={getIndex("cycle_id")}
        />
      )}

      {/* module */}
      {isVisible && (
        <ModuleSelect
          multiple
          projectId={projectId}
          value={data?.module_ids || []}
          onChange={(moduleIds) => handleData("module_ids", moduleIds)}
          placeholder="Modules"
          variant="pill-md"
          tabIndex={getIndex("module_ids")}
        />
      )}

      {/* estimate */}
      {isVisible && projectId && areEstimateEnabledByProjectId(projectId) && (
        <EstimateSelect
          value={data?.estimate_point || undefined}
          onChange={(estimatePoint) => handleData("estimate_point", estimatePoint)}
          projectId={projectId}
          variant="pill-md"
          placeholder="Estimate"
          tabIndex={getIndex("estimate_point")}
        />
      )}

      {/* add parent */}
      {isVisible && (
        <div className="h-7">
          {selectedParentIssue ? (
            <div className="h-full w-full">
              <Menu>
                <MenuTrigger
                  render={
                    <button
                      type="button"
                      tabIndex={getIndex("parent_id")}
                      className="flex h-full cursor-pointer items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong px-2 py-0.5 text-11 hover:bg-layer-1"
                    >
                      <ParentOutline className="h-3 w-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">
                        {`${selectedParentIssue.project__identifier}-${selectedParentIssue.sequence_id}`}
                      </span>
                    </button>
                  }
                />
                <MenuContent side="bottom" align="start">
                  <MenuItem label="Change parent work item" onClick={() => setParentIssueModalOpen(true)} />
                  <MenuItem
                    label="Remove parent work item"
                    onClick={() => {
                      handleData("parent_id", "");
                      setSelectedParentIssue(undefined);
                    }}
                  />
                </MenuContent>
              </Menu>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-full cursor-pointer items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong px-2 py-0.5 text-11 hover:bg-layer-1"
              onClick={() => setParentIssueModalOpen(true)}
            >
              <ParentOutline className="h-3 w-3 flex-shrink-0" />
              <span className="whitespace-nowrap">Add parent</span>
            </button>
          )}

          <ParentIssuesListModal
            isOpen={parentIssueModalOpen}
            handleClose={() => setParentIssueModalOpen(false)}
            onChange={(issue) => {
              handleData("parent_id", issue?.id);
              setSelectedParentIssue(issue);
            }}
            projectId={projectId}
            issueId={undefined}
          />
        </div>
      )}
    </div>
  );
});
