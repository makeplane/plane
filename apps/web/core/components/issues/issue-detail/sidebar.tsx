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
  CompletedAtPropertyIcon,
  CreatedAtPropertyIcon,
  CycleIcon,
  StatePropertyIcon,
  ModuleIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  DueDatePropertyIcon,
  LabelPropertyIcon,
  UpdatedAtPropertyIcon,
  UserCirclePropertyIcon,
  EstimatePropertyIcon,
  ParentPropertyIcon,
  ReleaseIcon,
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
import { IssueParentSelectRoot } from "@/components/issues/issue-detail/parent-select-root";
import { DateAlert } from "@/components/issues/issue-detail/date-alert";
import { TransferHopInfo } from "@/components/issues/issue-detail/transfer-hop-info";
import { IssueWorklogProperty } from "@/components/issues/worklog/property";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { useCurrentStateDuration, DurationBadge } from "@/components/issues/issue-detail/issue-activity/helpers";
import { WorkItemCustomPropertyValuesUpdate } from "@/components/work-item-types/values/addition-properties-update";
// local imports
import { IssueCycleSelect } from "./cycle-select";
import { IssueLabel } from "./label";
import { IssueModuleSelect } from "./module-select";
import type { TIssueOperations } from "./root";
import { WorkItemSidebarCustomers } from "./customers/root";
import { WorkItemSideBarMilestoneItem } from "./milestones/root";
import { ReleaseSelect } from "./release-select";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useCustomers } from "@/plane-web/hooks/store/customers/use-customers";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

export const IssueDetailsSidebar = observer(function IssueDetailsSidebar(props: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { isMilestonesEnabled } = useMilestones();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();

  const currentStateDuration = useCurrentStateDuration(issueId);

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue.created_by);

  // derived values
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);
  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);
  const isReleasesFeatureEnabled =
    useFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES) &&
    isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_RELEASES_ENABLED);

  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? getDate(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <>
      <div className="flex items-center h-full w-full flex-col divide-y-2 divide-subtle-1 overflow-hidden">
        <div className="h-full w-full overflow-y-auto px-6">
          <h5 className="mt-5 text-body-xs-medium">{t("common.properties")}</h5>
          <div className={`mb-2 mt-4 space-y-2.5 truncate ${!isEditable ? "opacity-60" : ""}`}>
            <SidebarPropertyListItem icon={StatePropertyIcon} label={t("common.state")}>
              <StateDropdown
                value={issue?.state_id}
                typeId={issue?.type_id}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    state_id: val,
                  })
                }
                projectId={projectId?.toString() ?? ""}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-full grow"
                buttonContainerClassName="w-full text-left h-7.5"
                buttonClassName="text-body-xs-regular"
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
                disabled={!isEditable}
                projectId={projectId?.toString() ?? ""}
                placeholder={t("issue.add.assignee")}
                multiple
                buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
                className="group w-full grow"
                buttonContainerClassName="w-full text-left h-7.5"
                buttonClassName={`text-body-xs-regular justify-between ${issue?.assignee_ids?.length > 0 ? "" : "text-placeholder"}`}
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
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="w-full h-7.5 grow rounded-sm"
                buttonContainerClassName="size-full text-left"
                buttonClassName="size-full px-2 py-0.5 whitespace-nowrap [&_svg]:size-3.5"
              />
            </SidebarPropertyListItem>

            {createdByDetails && (
              <SidebarPropertyListItem icon={UserCirclePropertyIcon} label={t("common.created_by")}>
                <div className="px-2 flex gap-2">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="grow truncate text-body-xs-regular leading-5">{createdByDetails?.display_name}</span>
                </div>
              </SidebarPropertyListItem>
            )}

            <SidebarPropertyListItem icon={StartDatePropertyIcon} label={t("common.order_by.start_date")}>
              <DateDropdown
                placeholder={t("issue.add.start_date")}
                value={issue.start_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    start_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                maxDate={maxDate ?? undefined}
                disabled={!isEditable}
                buttonVariant="transparent-with-text"
                className="group w-full grow"
                buttonContainerClassName="w-full text-left h-7.5"
                buttonClassName={`text-body-xs-regular ${issue?.start_date ? "" : "text-placeholder"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
              />
            </SidebarPropertyListItem>

            <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.order_by.due_date")}>
              <div className="flex items-center gap-2 w-full">
                <DateDropdown
                  placeholder={t("issue.add.due_date")}
                  value={issue.target_date}
                  onChange={(val) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, {
                      target_date: val ? renderFormattedPayloadDate(val) : null,
                    })
                  }
                  minDate={minDate ?? undefined}
                  disabled={!isEditable}
                  buttonVariant="transparent-with-text"
                  className="group w-full grow"
                  buttonContainerClassName="w-full text-left h-7.5"
                  buttonClassName={cn("text-body-xs-regular", {
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

            {projectId && areEstimateEnabledByProjectId(projectId) && (
              <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.estimate")}>
                <EstimateDropdown
                  value={issue?.estimate_point ?? undefined}
                  onChange={(val: string | undefined) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, {
                      estimate_point: val,
                    })
                  }
                  projectId={projectId}
                  disabled={!isEditable}
                  buttonVariant="transparent-with-text"
                  className="group w-full grow"
                  buttonContainerClassName="w-full text-left h-7.5"
                  buttonClassName={`text-body-xs-regular ${issue?.estimate_point !== null ? "" : "text-placeholder"}`}
                  placeholder={t("common.none")}
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
                  disabled={!isEditable}
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
                  disabled={!isEditable}
                />
              </SidebarPropertyListItem>
            )}

            <SidebarPropertyListItem icon={ParentPropertyIcon} label={t("common.parent")}>
              <IssueParentSelectRoot
                className="w-full h-7.5 grow"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={!isEditable}
              />
            </SidebarPropertyListItem>

            <SidebarPropertyListItem icon={LabelPropertyIcon} label={t("common.labels")}>
              <IssueLabel
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={!isEditable}
              />
            </SidebarPropertyListItem>

            <IssueWorklogProperty
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={!isEditable}
            />

            {isCustomersFeatureEnabled && (
              <WorkItemSidebarCustomers workItemId={issue.id} workspaceSlug={workspaceSlug} />
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
                  issueId={issueId}
                  onChange={(updatedIds) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, { release_ids: updatedIds })
                  }
                  releaseIds={issue?.release_ids}
                  disabled={!isEditable}
                  className="group w-full grow h-7.5"
                  buttonVariant="transparent-with-text"
                  buttonContainerClassName="w-full text-left h-7.5"
                  dropdownArrow
                  dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
                  hideIcon
                />
              </SidebarPropertyListItem>
            )}

            {issue.type_id && (
              <WorkItemCustomPropertyValuesUpdate
                issueId={issue.id}
                issueTypeId={issue.type_id}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                isDisabled={!isEditable}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
});
