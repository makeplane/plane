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
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <StateOutline className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              {issue?.state_id && (
                <div className="w-3/5 flex-grow">
                  {isIntakeAccepted ? (
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
                  )}
                </div>
              )}
            </div>
            {/* Assignee */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <MembersOutline className="h-4 w-4 flex-shrink-0" />
                <span>Assignees</span>
              </div>
              <div className="w-3/5 flex-grow">
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
              </div>
            </div>
            {/* Priority */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <PriorityOutline className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <div className="w-3/5 flex-grow">
                <PrioritySelect
                  value={issue?.priority}
                  onChange={(val) => {
                    if (!issue?.id) return;
                    void issueOperations.update(workspaceSlug, projectId, issue.id, { priority: val });
                  }}
                  disabled={!isEditable}
                  variant="select-ghost-md"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={`mt-3 divide-y-2 divide-subtle-1 ${!isEditable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Due Date */}
            <div className="flex h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <DueDateOutline className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <div className="w-3/5 flex-grow">
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
              </div>
            </div>
            {/* Labels */}
            <div className="flex min-h-8 items-center gap-2">
              <div className="flex w-2/5 flex-shrink-0 items-center gap-1 text-13 text-tertiary">
                <LabelsOutline className="h-4 w-4 flex-shrink-0" />
                <span>Labels</span>
              </div>
              <div className="h-full min-h-8 w-3/5 flex-grow pt-1">
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
              </div>
            </div>

            {/* duplicate to*/}
            {duplicateIssueDetails && (
              <div className="flex min-h-8 gap-2">
                <div className="flex w-2/5 flex-shrink-0 gap-1 pt-2 text-13 text-tertiary">
                  <DuplicateOfOutline className="h-4 w-4 flex-shrink-0" />
                  <span>Duplicate of</span>
                </div>

                <ControlLink
                  href={duplicateWorkItemLink}
                  onClick={() => {
                    router.push(duplicateWorkItemLink);
                  }}
                  target="_self"
                >
                  <Tooltip label={duplicateIssueDetails?.name ?? ""} layout="stacked">
                    <span className="flex cursor-pointer items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 pb-0.5 text-11 text-secondary">
                      {`${currentProjectDetails?.identifier}-${duplicateIssueDetails?.sequence_id}`}
                    </span>
                  </Tooltip>
                </ControlLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
