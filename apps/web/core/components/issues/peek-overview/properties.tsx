/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { RefreshCw } from "lucide-react";
// i18n
import { useTranslation } from "@plane/i18n";
// ui icons
import {
  CycleIcon,
  StatePropertyIcon,
  ModuleIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  DueDatePropertyIcon,
  LabelPropertyIcon,
  UserCirclePropertyIcon,
  EstimatePropertyIcon,
  ParentPropertyIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn, getDate, renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { FrequencyDropdown } from "@/plane-web/components/dropdowns/frequency";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useDraftStateTransition } from "@/hooks/store/use-draft-state-transition";
import { useTaskCategory } from "@/hooks/store/use-task-category";
// plane web components
import { IssueParentSelectRoot } from "@/plane-web/components/issues/issue-details/parent-select-root";
import { TaskCategoryProperty } from "@/plane-web/components/issues/issue-details/sidebar/task-category-property";
import { DueDateProperty } from "@/plane-web/components/issues/issue-details/sidebar/due-date-property";
import { TransferHopInfo } from "@/plane-web/components/issues/issue-details/sidebar/transfer-hop-info";
import { IssueWorklogProperty } from "@/plane-web/components/issues/worklog/property";
import { CompletedAtProperty } from "@/plane-web/components/issues/issue-details/sidebar/completed-at-property";
import type { TIssueOperations } from "../issue-detail";
import { IssueCycleSelect } from "../issue-detail/cycle-select";
import { IssueLabel } from "../issue-detail/label";
import { IssueModuleSelect } from "../issue-detail/module-select";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

export const PeekOverviewProperties = observer(function PeekOverviewProperties(props: IPeekOverviewProperties) {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  const { t } = useTranslation();
  // states
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  const { validateTransition } = useDraftStateTransition();
  const { fetchCategories } = useTaskCategory();

  useEffect(() => {
    if (workspaceSlug) void fetchCategories(workspaceSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;
  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const isEstimateEnabled = projectDetails?.estimate;
  const stateDetails = getStateById(issue.state_id);

  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  return (
    <div>
      <h6 className="text-body-xs-medium">{t("common.properties")}</h6>
      <div className={`w-full space-y-3 mt-3 ${disabled ? "opacity-60" : ""}`}>
        <SidebarPropertyListItem icon={StatePropertyIcon} label={t("common.state")}>
          <StateDropdown
            value={issue?.state_id}
            onChange={(val) => {
              const { missingFieldKeys, missingFieldLabels } = validateTransition(issue, val, stateDetails?.group);
              if (missingFieldKeys.length > 0) {
                setFieldErrors(missingFieldKeys);
                setToast({
                  type: TOAST_TYPE.ERROR,
                  title: t("issue.required_fields_missing"),
                  message: missingFieldLabels.join(", "),
                });
                return;
              }
              setFieldErrors([]);
              void issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val });
            }}
            projectId={projectId}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-full grow group"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-body-xs-medium ${issue?.state_id ? "" : "text-placeholder"}`}
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={MembersPropertyIcon} label={t("common.assignees")}>
          <div className={cn("w-full", fieldErrors.includes("assignee_ids") && "rounded border border-red-500")}>
            <MemberDropdown
              value={issue?.assignee_ids ?? undefined}
              onChange={(val) => void issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
              disabled={disabled}
              projectId={projectId}
              placeholder={t("issue.add.assignee")}
              multiple
              buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
              className="w-full grow group"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName={`text-body-xs-medium justify-between ${issue?.assignee_ids?.length > 0 ? "" : "text-placeholder"}`}
              hideIcon={issue.assignee_ids?.length === 0}
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={PriorityPropertyIcon} label={t("common.priority")}>
          <PriorityDropdown
            value={issue?.priority}
            onChange={(val) => void issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-full h-7.5 grow rounded-sm"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-body-xs-medium whitespace-nowrap [&_svg]:size-3.5 ${!issue?.priority ? "text-placeholder" : ""}`}
          />
        </SidebarPropertyListItem>

        <TaskCategoryProperty
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          issue={issue}
          issueOperations={issueOperations}
          isEditable={!disabled}
        />

        <SidebarPropertyListItem icon={RefreshCw} label={t("common.frequency")}>
          <div className={cn("w-full", fieldErrors.includes("frequency") && "rounded border border-red-500")}>
            <FrequencyDropdown
              value={issue?.frequency}
              onChange={(val) => void issueOperations.update(workspaceSlug, projectId, issueId, { frequency: val })}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="group w-full grow"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName="text-body-xs-medium"
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        </SidebarPropertyListItem>

        {createdByDetails && (
          <SidebarPropertyListItem
            icon={UserCirclePropertyIcon}
            label={t("common.created_by")}
            childrenClassName="px-2"
          >
            <ButtonAvatars
              showTooltip
              userIds={createdByDetails?.display_name.includes("-intake") ? null : createdByDetails?.id}
            />
            <span className="grow truncate text-body-xs-medium text-secondary leading-5">
              {createdByDetails?.display_name.includes("-intake") ? "Plane" : createdByDetails?.display_name}
            </span>
          </SidebarPropertyListItem>
        )}

        <SidebarPropertyListItem icon={StartDatePropertyIcon} label={t("common.order_by.start_date")}>
          <div className={cn("w-full", fieldErrors.includes("start_date") && "rounded border border-red-500")}>
            <DateDropdown
              value={issue.start_date}
              onChange={(val) =>
                void issueOperations.update(workspaceSlug, projectId, issueId, {
                  start_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              placeholder={t("issue.add.start_date")}
              buttonVariant="transparent-with-text"
              maxDate={maxDate ?? undefined}
              disabled={disabled}
              className="w-full grow group"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName={`text-body-xs-medium ${issue?.start_date ? "" : "text-placeholder"}`}
              hideIcon
              clearIconClassName="h-3 w-3 hidden group-hover:inline"
            />
          </div>
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.order_by.due_date")}>
          <DueDateProperty
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issueOperations={issueOperations}
            isEditable={!disabled}
            stateGroup={stateDetails?.group}
            minDate={minDate ?? undefined}
            hasFieldError={fieldErrors.includes("target_date")}
            issue={issue}
          />
        </SidebarPropertyListItem>

        <CompletedAtProperty issueId={issueId} />

        {isEstimateEnabled && (
          <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.estimate")}>
            <EstimateDropdown
              value={issue.estimate_point ?? undefined}
              onChange={(val) =>
                void issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })
              }
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="w-full grow group"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName={`text-body-xs-medium ${issue?.estimate_point !== undefined ? "" : "text-placeholder"}`}
              placeholder="None"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </SidebarPropertyListItem>
        )}

        {projectDetails?.module_view && (
          <SidebarPropertyListItem icon={ModuleIcon} label={t("common.modules")}>
            <div className={cn("w-full", fieldErrors.includes("module_ids") && "rounded border border-red-500")}>
              <IssueModuleSelect
                className="w-full grow"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={disabled}
              />
            </div>
          </SidebarPropertyListItem>
        )}

        {projectDetails?.cycle_view && (
          <SidebarPropertyListItem
            icon={CycleIcon}
            label={t("common.cycle")}
            appendElement={<TransferHopInfo workItem={issue} />}
          >
            <IssueCycleSelect
              className="w-full grow h-7.5"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </SidebarPropertyListItem>
        )}

        <SidebarPropertyListItem icon={ParentPropertyIcon} label={t("common.parent")}>
          <IssueParentSelectRoot
            className="w-full h-7.5 grow"
            disabled={disabled}
            issueId={issueId}
            issueOperations={issueOperations}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={LabelPropertyIcon} label={t("common.labels")}>
          <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
        </SidebarPropertyListItem>

        {projectDetails?.is_time_tracking_enabled !== false && (
          <IssueWorklogProperty
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
});
