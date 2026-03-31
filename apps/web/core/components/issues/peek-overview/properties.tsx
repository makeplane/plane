/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import {
  CreatedAtPropertyIcon,
  CycleIcon,
  CompletedAtPropertyIcon,
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
  ReleaseIcon,
  UpdatedAtPropertyIcon,
} from "@plane/propel/icons";
import {
  cn,
  getDate,
  renderFormattedDate,
  renderFormattedDateTime,
  renderFormattedPayloadDate,
  shouldHighlightIssueDueDate,
} from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { useCurrentStateDuration, DurationBadge } from "@/components/issues/issue-detail/issue-activity/helpers";
import { IssueParentSelectRoot } from "@/components/issues/issue-detail/parent-select-root";
import { DateAlert } from "@/components/issues/issue-detail/date-alert";
import { TransferHopInfo } from "@/components/issues/issue-detail/transfer-hop-info";
import { IssueWorklogProperty } from "@/components/issues/worklog/property";
import { WorkItemCustomPropertyValuesUpdate } from "@/components/work-item-types/values/addition-properties-update";
// local imports
import type { TIssueOperations } from "../issue-detail";
import { IssueCycleSelect } from "../issue-detail/cycle-select";
import { IssueLabel } from "../issue-detail/label";
import { IssueModuleSelect } from "../issue-detail/module-select";
import { WorkItemSidebarCustomers } from "../issue-detail/customers/root";
import { WorkItemSideBarMilestoneItem } from "../issue-detail/milestones/root";
import { ReleaseSelect } from "../issue-detail/release-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

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
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { isMilestonesEnabled } = useMilestones();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const currentStateDuration = useCurrentStateDuration(issueId);
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;
  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const isEstimateEnabled = projectDetails?.estimate;
  const stateDetails = getStateById(issue.state_id);
  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);
  const isReleasesFeatureEnabled =
    useFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES) &&
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_RELEASES_ENABLED);

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
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                state_id: val,
              })
            }
            projectId={projectId}
            typeId={issue.type_id}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-full grow group"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-body-xs-medium ${issue?.state_id ? "" : "text-placeholder"}`}
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            appendElement={<DurationBadge seconds={currentStateDuration} />}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={MembersPropertyIcon} label={t("common.assignees")}>
          <MemberDropdown
            value={issue?.assignee_ids ?? undefined}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                assignee_ids: val,
              })
            }
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
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={PriorityPropertyIcon} label={t("common.priority")}>
          <PriorityDropdown
            value={issue?.priority}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                priority: val,
              })
            }
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-full h-7.5 grow rounded-sm"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-body-xs-medium whitespace-nowrap [&_svg]:size-3.5 ${!issue?.priority || issue?.priority === "none" ? "text-placeholder" : ""}`}
          />
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
          <DateDropdown
            value={issue.start_date}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
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
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.order_by.due_date")}>
          <div className="flex items-center gap-2 w-full">
            <DateDropdown
              value={issue.target_date}
              onChange={(val) =>
                issueOperations.update(workspaceSlug, projectId, issueId, {
                  target_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              placeholder={t("issue.add.due_date")}
              buttonVariant="transparent-with-text"
              minDate={minDate ?? undefined}
              disabled={disabled}
              className="w-full grow group"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName={cn("text-body-xs-medium", {
                "text-placeholder": !issue.target_date,
                "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
              })}
              hideIcon
              clearIconClassName="h-3 w-3 hidden group-hover:inline text-primary"
            />
            {issue.target_date && <DateAlert date={issue.target_date} workItem={issue} projectId={projectId} />}
          </div>
        </SidebarPropertyListItem>

        {issue.created_at && (
          <SidebarPropertyListItem
            icon={CreatedAtPropertyIcon}
            label={t("common.created_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(issue.created_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {(issue.last_activity_at || issue.updated_at) && (
          <SidebarPropertyListItem
            icon={UpdatedAtPropertyIcon}
            label={t("common.updated_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(issue.last_activity_at ?? issue.updated_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {issue.completed_at && (
          <SidebarPropertyListItem
            icon={CompletedAtPropertyIcon}
            label={t("common.completed_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(issue.completed_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {isEstimateEnabled && (
          <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.estimate")}>
            <EstimateDropdown
              value={issue.estimate_point ?? undefined}
              onChange={(val) =>
                issueOperations.update(workspaceSlug, projectId, issueId, {
                  estimate_point: val,
                })
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
            <IssueModuleSelect
              className="w-full grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
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

        <IssueWorklogProperty
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />

        {isCustomersFeatureEnabled && (
          <WorkItemSidebarCustomers workItemId={issueId} workspaceSlug={workspaceSlug} isPeekView />
        )}

        {isMilestonesFeatureEnabled && (
          <WorkItemSideBarMilestoneItem
            projectId={projectId}
            milestoneId={issue.milestone_id}
            updateWorkItemMilestone={(milestoneId) =>
              issueOperations.updateWorkItemMilestone?.(workspaceSlug, projectId, issueId, milestoneId)
            }
          />
        )}

        {isReleasesFeatureEnabled && (
          <SidebarPropertyListItem icon={ReleaseIcon} label={t("releases.label", { count: 2 })}>
            <ReleaseSelect
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              releaseIds={issue?.release_ids}
              disabled={disabled}
              className="w-full grow"
            />
          </SidebarPropertyListItem>
        )}

        {issue.type_id && (
          <WorkItemCustomPropertyValuesUpdate
            issueId={issueId}
            issueTypeId={issue.type_id}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            isDisabled={disabled}
          />
        )}
      </div>
    </div>
  );
});
