/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import {
  DueDateOutline,
  DuplicateOfOutline,
  LabelsOutline,
  MembersOutline,
  PriorityOutline,
  StateOutline,
} from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import type { TInboxDuplicateIssueDetails, TIssue } from "@plane/types";
import { ControlLink } from "@plane/blocks/layout";
import { getDate, renderFormattedPayloadDate, generateWorkItemLink } from "@plane/utils";
// components
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { IntakeStateSelect } from "@/components/dropdowns/intake-state/intake-state-select";
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueLabel } from "@/components/issues/issue-detail/label";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserProfile } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issue: Partial<TIssue>;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  duplicateIssueDetails: TInboxDuplicateIssueDetails | undefined;
  isIntakeAccepted: boolean;
};

export const InboxIssueContentProperties = observer(function InboxIssueContentProperties(props: Props) {
  const { workspaceSlug, projectId, issue, issueOperations, isEditable, duplicateIssueDetails, isIntakeAccepted } =
    props;

  const router = useAppRouter();
  // store hooks
  const { currentProjectDetails } = useProject();
  const { data: userProfile } = useUserProfile();
  const { t } = useTranslation();

  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());
  if (!issue || !issue?.id) return <></>;

  const duplicateWorkItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId,
    issueId: duplicateIssueDetails?.id,
    projectIdentifier: currentProjectDetails?.identifier,
    sequenceId: duplicateIssueDetails?.sequence_id,
  });

  return (
    <div className="flex w-full flex-col divide-y-2 divide-subtle-1">
      <div className="w-full overflow-y-auto">
        <h5 className="mb-2 text-body-sm-medium">Properties</h5>
        <div className={`divide-y-2 divide-subtle-1 ${!isEditable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Intake State */}
            <SidebarPropertyListItem icon={StateOutline} label="State">
              {issue?.state_id &&
                (isIntakeAccepted ? (
                  <StateSelect
                    value={issue.state_id}
                    onChange={() => {}}
                    projectId={projectId}
                    disabled
                    variant="select-ghost-md"
                  />
                ) : (
                  <IntakeStateSelect
                    workspaceSlug={workspaceSlug}
                    value={issue.state_id}
                    onChange={() => {}}
                    projectId={projectId}
                    disabled
                    variant="select-ghost-md"
                  />
                ))}
            </SidebarPropertyListItem>
            {/* Assignee */}
            <SidebarPropertyListItem icon={MembersOutline} label="Assignees">
              <MemberSelect
                value={issue?.assignee_ids ?? []}
                onChange={(val) => {
                  if (!issue?.id) return;
                  void issueOperations.update(workspaceSlug, projectId, issue.id, { assignee_ids: val });
                }}
                disabled={!isEditable}
                projectId={projectId?.toString() ?? ""}
                placeholder="Add assignees"
                multiple
                variant="select-ghost-md"
                showLabel={(issue?.assignee_ids ?? []).length <= 1}
              />
            </SidebarPropertyListItem>
            {/* Priority */}
            <SidebarPropertyListItem icon={PriorityOutline} label="Priority">
              <PrioritySelect
                value={issue?.priority}
                onChange={(val) => {
                  if (!issue?.id) return;
                  void issueOperations.update(workspaceSlug, projectId, issue.id, { priority: val });
                }}
                disabled={!isEditable}
                variant="select-ghost-md"
              />
            </SidebarPropertyListItem>
          </div>
        </div>
        <div className={`mt-3 divide-y-2 divide-subtle-1 ${!isEditable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Due Date */}
            <SidebarPropertyListItem icon={DueDateOutline} label="Due date">
              <DateSelect
                placeholder="Add due date"
                value={getDate(issue.target_date) ?? null}
                onChange={(val) => {
                  if (!issue?.id) return;
                  void issueOperations.update(workspaceSlug, projectId, issue.id, {
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  });
                }}
                minDate={minDate ?? undefined}
                disabled={!isEditable}
                weekStartsOn={userProfile?.start_of_the_week}
                clearable
                clearLabel={t("common.clear")}
                variant="select-ghost-md"
              />
            </SidebarPropertyListItem>
            {/* Labels */}
            <SidebarPropertyListItem icon={LabelsOutline} label="Labels">
              {issue?.id && (
                <IssueLabel
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issue?.id}
                  disabled={!isEditable}
                  isInboxIssue
                  onLabelUpdate={(val: string[]) =>
                    issue?.id && issueOperations.update(workspaceSlug, projectId, issue?.id, { label_ids: val })
                  }
                />
              )}
            </SidebarPropertyListItem>
            {/* duplicate to*/}
            {duplicateIssueDetails && (
              <SidebarPropertyListItem icon={DuplicateOfOutline} label="Duplicate of">
                <ControlLink
                  href={duplicateWorkItemLink}
                  onClick={() => {
                    router.push(duplicateWorkItemLink);
                  }}
                  target="_self"
                >
                  <Tooltip label={duplicateIssueDetails?.name ?? ""} layout="stacked">
                    <span className="flex cursor-pointer items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 pb-0.5 text-caption-sm-regular text-secondary">
                      {`${currentProjectDetails?.identifier}-${duplicateIssueDetails?.sequence_id}`}
                    </span>
                  </Tooltip>
                </ControlLink>
              </SidebarPropertyListItem>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
