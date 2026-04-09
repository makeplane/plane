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
import { EntityDetailPrimaryProperties, PropertyDivider } from "@plane/blocks/entity-detail";
import { useTranslation } from "@plane/i18n";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { DateAlert } from "@/components/issues/issue-detail/date-alert";
import { useCurrentStateDuration, DurationBadge } from "@/components/issues/issue-detail/issue-activity/helpers";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { useFlag } from "@/plane-web/hooks/store/use-flag";
// local imports
import type { TIssueOperations } from "./root";
import { DueDatePropertyIcon, StartDatePropertyIcon } from "@plane/propel/icons";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
};

export const DetailMetaRow = observer(function DetailMetaRow(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable, isArchived } = props;
  const { t } = useTranslation();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isApprovalPending } = useWorkflows();

  const { getStateById } = useProjectState();

  const issue = getIssueById(issueId);
  const isApprovalPendingState = issue?.state_id
    ? isApprovalPending(workspaceSlug, projectId, issue.type_id, issue.state_id)
    : false;

  const disabled = isArchived || !isEditable;
  const stateDetails = getStateById(issue?.state_id);

  const minDate = issue?.start_date ? getDate(issue?.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue?.target_date ? getDate(issue?.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const isStateDurationEnabled = useFlag(workspaceSlug, "WORK_ITEM_STATE_DURATION");
  const currentStateDuration = useCurrentStateDuration(issueId);
  const assigneeCount = issue?.assignee_ids?.length ?? 0;

  if (!issue) return null;

  return (
    <div className="-ml-3">
      <EntityDetailPrimaryProperties>
        {/* State */}
        <StateDropdown
          value={issue.state_id}
          typeId={issue.type_id}
          onChange={(val) =>
            issueOperations.update(workspaceSlug, projectId, issueId, {
              state_id: val,
            })
          }
          projectId={projectId}
          disabled={disabled || isApprovalPendingState}
          buttonVariant="transparent-with-text"
          className="w-full px-1"
          buttonContainerClassName="w-full h-7 rounded-md hover:bg-layer-transparent-hover"
          buttonClassName="text-body-xs-medium"
          dropdownArrow={false}
          appendElement={
            isStateDurationEnabled ? (
              <DurationBadge seconds={currentStateDuration} stateName={stateDetails?.name} />
            ) : undefined
          }
        />

        <PropertyDivider />

        {/* Priority */}
        <PriorityDropdown
          value={issue.priority}
          onChange={(val) =>
            issueOperations.update(workspaceSlug, projectId, issueId, {
              priority: val,
            })
          }
          disabled={disabled}
          buttonVariant="transparent-with-text"
          className="w-full px-1"
          buttonContainerClassName="w-full h-7 rounded-md hover:bg-layer-transparent-hover"
          buttonClassName="text-body-xs-medium whitespace-nowrap [&_svg]:size-3.5"
        />

        <PropertyDivider />

        {/* Assignees */}
        <MemberDropdown
          value={issue.assignee_ids ?? undefined}
          onChange={(val) =>
            issueOperations.update(workspaceSlug, projectId, issueId, {
              assignee_ids: val,
            })
          }
          disabled={disabled}
          projectId={projectId}
          placeholder={t("issue.add.assignee")}
          multiple
          buttonVariant={assigneeCount > 1 ? "transparent-without-text" : "transparent-with-text"}
          className="w-full px-1"
          buttonContainerClassName="w-full h-7 rounded-md hover:bg-layer-transparent-hover"
          buttonClassName={cn("text-body-xs-medium", {
            "text-placeholder": assigneeCount === 0,
          })}
          hideIcon={assigneeCount === 0}
        />

        <PropertyDivider />

        {/* Start date */}
        <DateDropdown
          placeholder={t("common.order_by.start_date")}
          value={issue.start_date}
          onChange={(val) =>
            issueOperations.update(workspaceSlug, projectId, issueId, {
              start_date: val ? renderFormattedPayloadDate(val) : null,
            })
          }
          maxDate={maxDate ?? undefined}
          disabled={disabled}
          buttonVariant="transparent-with-text"
          className="group w-full px-1"
          buttonContainerClassName="w-full h-7 rounded-md hover:bg-layer-transparent-hover"
          buttonClassName={cn("text-body-xs-medium", {
            "text-placeholder": !issue.start_date,
          })}
          hideIcon={false}
          clearIconClassName="h-3 w-3 hidden group-hover:inline"
          icon={<StartDatePropertyIcon />}
        />

        <PropertyDivider />

        {/* Due date */}
        <div className="flex items-center gap-1 w-full">
          <DateDropdown
            placeholder={t("common.order_by.due_date")}
            value={issue.target_date}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                target_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            minDate={minDate ?? undefined}
            disabled={disabled}
            buttonVariant="transparent-with-text"
            className="group w-full px-1"
            buttonContainerClassName="w-full h-7 rounded-md hover:bg-layer-transparent-hover"
            buttonClassName={cn("text-body-xs-medium", {
              "text-placeholder": !issue.target_date,
              "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
            })}
            hideIcon={false}
            clearIconClassName="h-3 w-3 hidden group-hover:inline"
            icon={<DueDatePropertyIcon />}
          />
          {issue.target_date && <DateAlert date={issue.target_date} workItem={issue} projectId={projectId} />}
        </div>
      </EntityDetailPrimaryProperties>
    </div>
  );
});
