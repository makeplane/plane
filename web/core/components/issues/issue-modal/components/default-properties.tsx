"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { Control, Controller } from "react-hook-form";
import { LayoutPanelTop } from "lucide-react";
// types
import { ISearchIssueResponse, TIssue } from "@plane/types";
// ui
import { CustomMenu } from "@plane/ui";
// components
import {
  CycleDropdown,
  DateDropdown,
  EstimateDropdown,
  ModuleDropdown,
  PriorityDropdown,
  MemberDropdown,
  StateDropdown,
} from "@/components/dropdowns";
import { ParentIssuesListModal } from "@/components/issues";
import { IssueLabelSelect } from "@/components/issues/select";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getTabIndex } from "@/helpers/issue-modal.helper";
// hooks
import { useProjectEstimates, useProject } from "@/hooks/store";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues";

type TIssueDefaultPropertiesProps = {
  control: Control<TIssue>;
  id: string | undefined;
  projectId: string | null;
  workspaceSlug: string;
  selectedParentIssue: ISearchIssueResponse | null;
  startDate: string | null;
  targetDate: string | null;
  parentId: string | null;
  isDraft: boolean;
  handleFormChange: () => void;
  setLabelModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedParentIssue: (issue: ISearchIssueResponse) => void;
};

export const IssueDefaultProperties: React.FC<TIssueDefaultPropertiesProps> = observer((props) => {
  const {
    control,
    id,
    projectId,
    workspaceSlug,
    selectedParentIssue,
    startDate,
    targetDate,
    parentId,
    isDraft,
    handleFormChange,
    setLabelModal,
    setSelectedParentIssue,
  } = props;
  // states
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  // store hooks
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getProjectById } = useProject();
  // derived values
  const projectDetails = getProjectById(projectId);

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        control={control}
        name="state_id"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <StateDropdown
              value={value}
              onChange={(stateId) => {
                onChange(stateId);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              buttonVariant="border-with-text"
              tabIndex={getTabIndex("state_id")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <PriorityDropdown
              value={value}
              onChange={(priority) => {
                onChange(priority);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              tabIndex={getTabIndex("priority")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="assignee_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <MemberDropdown
              projectId={projectId ?? undefined}
              value={value}
              onChange={(assigneeIds) => {
                onChange(assigneeIds);
                handleFormChange();
              }}
              buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
              buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
              placeholder="Assignees"
              multiple
              tabIndex={getTabIndex("assignee_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="label_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <IssueLabelSelect
              setIsOpen={setLabelModal}
              value={value}
              onChange={(labelIds) => {
                onChange(labelIds);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              tabIndex={getTabIndex("label_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="start_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              maxDate={maxDate ?? undefined}
              placeholder="Start date"
              tabIndex={getTabIndex("start_date")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="target_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              minDate={minDate ?? undefined}
              placeholder="Due date"
              tabIndex={getTabIndex("target_date")}
            />
          </div>
        )}
      />
      {projectDetails?.cycle_view && (
        <Controller
          control={control}
          name="cycle_id"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <CycleDropdown
                projectId={projectId ?? undefined}
                onChange={(cycleId) => {
                  onChange(cycleId);
                  handleFormChange();
                }}
                placeholder="Cycle"
                value={value}
                buttonVariant="border-with-text"
                tabIndex={getTabIndex("cycle_id")}
              />
            </div>
          )}
        />
      )}
      {projectDetails?.module_view && workspaceSlug && (
        <Controller
          control={control}
          name="module_ids"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <ModuleDropdown
                projectId={projectId ?? undefined}
                value={value ?? []}
                onChange={(moduleIds) => {
                  onChange(moduleIds);
                  handleFormChange();
                }}
                placeholder="Modules"
                buttonVariant="border-with-text"
                tabIndex={getTabIndex("module_ids")}
                multiple
                showCount
              />
            </div>
          )}
        />
      )}
      {projectId && areEstimateEnabledByProjectId(projectId) && (
        <Controller
          control={control}
          name="estimate_point"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <EstimateDropdown
                value={value || undefined}
                onChange={(estimatePoint) => {
                  onChange(estimatePoint);
                  handleFormChange();
                }}
                projectId={projectId}
                buttonVariant="border-with-text"
                tabIndex={getTabIndex("estimate_point")}
                placeholder="Estimate"
              />
            </div>
          )}
        />
      )}
      {parentId ? (
        <CustomMenu
          customButton={
            <button
              type="button"
              className="flex cursor-pointer items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1.5 text-xs hover:bg-custom-background-80"
            >
              {selectedParentIssue?.project_id && (
                <IssueIdentifier
                  projectId={selectedParentIssue.project_id}
                  issueTypeId={selectedParentIssue.type_id}
                  projectIdentifier={selectedParentIssue?.project__identifier}
                  issueSequenceId={selectedParentIssue.sequence_id}
                  textContainerClassName="text-xs"
                />
              )}
            </button>
          }
          placement="bottom-start"
          tabIndex={getTabIndex("parent_id")}
        >
          <>
            <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueListModalOpen(true)}>
              Change parent issue
            </CustomMenu.MenuItem>
            <Controller
              control={control}
              name="parent_id"
              render={({ field: { onChange } }) => (
                <CustomMenu.MenuItem
                  className="!p-1"
                  onClick={() => {
                    onChange(null);
                    handleFormChange();
                  }}
                >
                  Remove parent issue
                </CustomMenu.MenuItem>
              )}
            />
          </>
        </CustomMenu>
      ) : (
        <button
          type="button"
          className="flex cursor-pointer items-center justify-between gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1.5 text-xs hover:bg-custom-background-80"
          onClick={() => setParentIssueListModalOpen(true)}
        >
          <LayoutPanelTop className="h-3 w-3 flex-shrink-0" />
          <span className="whitespace-nowrap">Add parent</span>
        </button>
      )}
      <Controller
        control={control}
        name="parent_id"
        render={({ field: { onChange } }) => (
          <ParentIssuesListModal
            isOpen={parentIssueListModalOpen}
            handleClose={() => setParentIssueListModalOpen(false)}
            onChange={(issue) => {
              onChange(issue.id);
              handleFormChange();
              setSelectedParentIssue(issue);
            }}
            projectId={projectId ?? undefined}
            issueId={isDraft ? undefined : id}
          />
        )}
      />
    </div>
  );
});
