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
import { useTranslation } from "@plane/i18n";
// ui
import {
  CompletedAtPropertyIcon,
  CreatedAtPropertyIcon,
  DueDatePropertyIcon,
  EstimatePropertyIcon,
  InitiativeIcon,
  LabelPropertyIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  StatePropertyIcon,
  UpdatedAtPropertyIcon,
  UserCirclePropertyIcon,
} from "@plane/propel/icons";
// types
import { EIssueServiceType, EWorkItemTypeEntity } from "@plane/types";
// components
import {
  cn,
  getDate,
  renderFormattedDate,
  renderFormattedDateTime,
  renderFormattedPayloadDate,
  shouldHighlightIssueDueDate,
} from "@plane/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { IssueLabel } from "@/components/issues/issue-detail/label";
import { WorkItemSidebarCustomers } from "@/components/issues/issue-detail/customers/root";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { SidebarContentWrapper } from "@/components/common/layout/sidebar/content-wrapper";
import { InitiativeMultiSelectModal } from "@/components/initiatives/common/multi-select-modal";
import { WorkItemCustomPropertyValuesUpdate } from "@/components/work-item-types/values/addition-properties-update";
import { DateAlert } from "@/components/issues/issue-detail/date-alert";
import { WorkItemSideBarMilestoneItem } from "@/components/issues/issue-detail/milestones/root";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useCustomers } from "@/plane-web/hooks/store/customers";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { useEpicOperations } from "../helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled: boolean;
};

export const EpicSidebarPropertiesRoot = observer(function EpicSidebarPropertiesRoot(props: Props) {
  const { workspaceSlug, projectId, epicId, disabled } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  const { isCustomersFeatureEnabled } = useCustomers();
  const { isMilestonesEnabled } = useMilestones();
  const {
    initiative: { isInitiativeModalOpen, toggleInitiativeModal },
  } = useInitiatives();
  const { t } = useTranslation();

  // derived values
  const epicDetails = getIssueById(epicId);
  const isMilestonesFeatureEnabled = isMilestonesEnabled(workspaceSlug, projectId);

  const epicOperations = useEpicOperations();

  if (!epicDetails) return <></>;

  // derived values
  const createdByDetails = getUserDetails(epicDetails.created_by);
  const stateDetails = getStateById(epicDetails.state_id);

  // min and max date for start and target date
  const minDate = epicDetails.start_date ? getDate(epicDetails.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = epicDetails.target_date ? getDate(epicDetails.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <SidebarContentWrapper title="Properties">
      <InitiativeMultiSelectModal
        isOpen={isInitiativeModalOpen === epicId}
        onClose={() => toggleInitiativeModal()}
        selectedInitiativeIds={epicDetails.initiative_ids ?? []}
        onSubmit={(initiativeIds) =>
          epicOperations.update(workspaceSlug, projectId, epicId, {
            initiative_ids: initiativeIds,
          })
        }
      />
      <div className={`mb-2 space-y-2.5 ${disabled ? "opacity-60" : ""}`}>
        <SidebarPropertyListItem icon={StatePropertyIcon} label="State">
          <StateDropdown
            value={epicDetails?.state_id}
            onChange={(val) =>
              epicOperations.update(workspaceSlug, projectId, epicId, {
                state_id: val,
              })
            }
            projectId={projectId?.toString() ?? ""}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="group w-full grow"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName="text-13"
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={MembersPropertyIcon} label="Assignees">
          <MemberDropdown
            value={epicDetails?.assignee_ids ?? undefined}
            onChange={(val) =>
              epicOperations.update(workspaceSlug, projectId, epicId, {
                assignee_ids: val,
              })
            }
            disabled={disabled}
            projectId={projectId?.toString() ?? ""}
            placeholder="Add assignees"
            multiple
            buttonVariant={epicDetails?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
            className="group w-full grow"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-13 justify-between ${epicDetails?.assignee_ids?.length > 0 ? "" : "text-placeholder"}`}
            hideIcon={epicDetails.assignee_ids?.length === 0}
            dropdownArrow
            dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={PriorityPropertyIcon} label="Priority">
          <PriorityDropdown
            value={epicDetails?.priority}
            onChange={(val) =>
              epicOperations.update(workspaceSlug, projectId, epicId, {
                priority: val,
              })
            }
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="w-full h-7.5 grow rounded-sm"
            buttonContainerClassName="size-full text-left"
            buttonClassName="size-full px-2 py-0.5 whitespace-nowrap [&_svg]:size-3.5"
          />
        </SidebarPropertyListItem>

        {createdByDetails && (
          <SidebarPropertyListItem icon={UserCirclePropertyIcon} label="Created by" childrenClassName="px-2">
            <ButtonAvatars showTooltip userIds={createdByDetails.id} />
            <span className="grow truncate text-11 leading-5">{createdByDetails?.display_name}</span>
          </SidebarPropertyListItem>
        )}
        <SidebarPropertyListItem icon={InitiativeIcon} label="Initiatives">
          <button
            type="button"
            className={cn(
              "w-full h-7.5 text-left px-2 py-0.5 rounded text-13 text-secondary hover:bg-layer-transparent-hover",
              {
                "text-placeholder": !epicDetails.initiative_ids?.length,
              }
            )}
            onClick={() => toggleInitiativeModal(epicId)}
            disabled={disabled}
          >
            {epicDetails.initiative_ids?.length
              ? t("initiatives.placeholder", {
                  count: epicDetails.initiative_ids?.length,
                })
              : t("initiatives.add_initiative")}
          </button>
        </SidebarPropertyListItem>
        <SidebarPropertyListItem icon={StartDatePropertyIcon} label="Start date">
          <DateDropdown
            placeholder="Add start date"
            value={epicDetails.start_date}
            onChange={(val) =>
              epicOperations.update(workspaceSlug, projectId, epicId, {
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            maxDate={maxDate ?? undefined}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="group w-full grow"
            buttonContainerClassName="w-full text-left h-7.5"
            buttonClassName={`text-13 ${epicDetails?.start_date ? "" : "text-placeholder"}`}
            hideIcon
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={DueDatePropertyIcon} label="Due date">
          <div className="flex items-center gap-2 w-full">
            <DateDropdown
              placeholder="Add due date"
              value={epicDetails.target_date}
              onChange={(val) =>
                epicOperations.update(workspaceSlug, projectId, epicId, {
                  target_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              minDate={minDate ?? undefined}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="group w-full grow"
              buttonContainerClassName="w-full text-left h-7.5"
              buttonClassName={cn("w-full text-body-xs-regular", {
                "text-placeholder": !epicDetails.target_date,
                "text-danger-primary": shouldHighlightIssueDueDate(epicDetails.target_date, stateDetails?.group),
              })}
              hideIcon
              clearIconClassName="h-3 w-3 hidden group-hover:inline !text-primary"
            />
            {epicDetails.target_date && (
              <DateAlert date={epicDetails.target_date} workItem={epicDetails} projectId={projectId} />
            )}
          </div>
        </SidebarPropertyListItem>

        {epicDetails.created_at && (
          <SidebarPropertyListItem
            icon={CreatedAtPropertyIcon}
            label={t("common.created_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(epicDetails.created_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {(epicDetails.last_activity_at || epicDetails.updated_at) && (
          <SidebarPropertyListItem
            icon={UpdatedAtPropertyIcon}
            label={t("common.updated_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(epicDetails.last_activity_at ?? epicDetails.updated_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {epicDetails.completed_at && (
          <SidebarPropertyListItem
            icon={CompletedAtPropertyIcon}
            label={t("common.completed_at")}
            childrenClassName="px-1.5 h-7.5"
          >
            <span className="truncate text-body-xs-medium text-secondary">
              {renderFormattedDateTime(epicDetails.completed_at)}
            </span>
          </SidebarPropertyListItem>
        )}

        {projectId && areEstimateEnabledByProjectId(projectId) && (
          <SidebarPropertyListItem icon={EstimatePropertyIcon} label="Estimate">
            <EstimateDropdown
              value={epicDetails?.estimate_point ?? undefined}
              onChange={(val: string | undefined) =>
                epicOperations.update(workspaceSlug, projectId, epicId, {
                  estimate_point: val,
                })
              }
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="group w-full grow"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-13 ${epicDetails?.estimate_point !== null ? "" : "text-placeholder"}`}
              placeholder="None"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </SidebarPropertyListItem>
        )}

        <SidebarPropertyListItem icon={LabelPropertyIcon} label="Labels">
          <IssueLabel
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={epicId}
            disabled={disabled}
            issueServiceType={EIssueServiceType.EPICS}
          />
        </SidebarPropertyListItem>

        {isCustomersFeatureEnabled && (
          <WorkItemSidebarCustomers
            workItemId={epicId}
            workspaceSlug={workspaceSlug}
            isPeekView={false}
            disabled={disabled}
          />
        )}

        {isMilestonesFeatureEnabled && (
          <WorkItemSideBarMilestoneItem
            projectId={projectId}
            milestoneId={epicDetails.milestone_id}
            updateWorkItemMilestone={(milestoneId) =>
              epicOperations.updateWorkItemMilestone?.(workspaceSlug, projectId, epicId, milestoneId)
            }
            disabled={disabled}
          />
        )}

        {epicDetails.type_id && (
          <WorkItemCustomPropertyValuesUpdate
            issueId={epicId}
            issueTypeId={epicDetails.type_id}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
            isDisabled={disabled}
            entityType={EWorkItemTypeEntity.EPIC}
            issueServiceType={EIssueServiceType.EPICS}
          />
        )}
      </div>
    </SidebarContentWrapper>
  );
});
