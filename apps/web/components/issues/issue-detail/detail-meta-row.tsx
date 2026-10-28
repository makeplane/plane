/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { DueDateOutline, StartDateOutline } from "@makeplane/propel/icons";
import { DateSelect } from "@plane/blocks/property-select";
import { useTranslation } from "@plane/i18n";
import { getDate, getIssueDueDateClassName, renderFormattedPayloadDate } from "@plane/utils";
// components
import { MemberSelect } from "@/components/dropdowns/member/member-select";
import { PrioritySelect } from "@/components/dropdowns/priority/priority-select";
import { StateSelect } from "@/components/dropdowns/state/state-select";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUserProfile } from "@/hooks/store/user";
// local imports
import type { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled: boolean;
};

function PropertyDivider() {
  return <div data-divider aria-hidden className="h-7 shrink-0 border-l border-subtle" />;
}

/**
 * Inline bar of the primary work item properties (state, priority, assignees, start and due date),
 * rendered under the title on the detail page and in the peek overview.
 */
export const IssueDetailMetaRow = observer(function IssueDetailMetaRow(props: Props) {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  // hooks
  const { t } = useTranslation();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { data: userProfile } = useUserProfile();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return null;

  const stateDetails = getStateById(issue.state_id);
  const minDate = getDate(issue.start_date) ?? undefined;
  const maxDate = getDate(issue.target_date) ?? undefined;

  return (
    <div className="-ml-3">
      <div className="flex w-full flex-wrap items-center gap-y-2 rounded-lg py-0.5 [&>*:not([data-divider])]:min-w-24 [&>*:not([data-divider])]:flex-1">
        <div className="flex w-full items-center px-1">
          <StateSelect
            testId="work-item-state-select"
            value={issue.state_id}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
            projectId={projectId}
            disabled={disabled}
            variant="select-ghost-lg"
            tooltip
          />
        </div>

        <PropertyDivider />

        <div className="flex w-full items-center px-1">
          <PrioritySelect
            testId="work-item-priority-select"
            value={issue.priority}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
            disabled={disabled}
            className="w-full"
            variant="select-ghost-lg"
            tooltip
          />
        </div>

        <PropertyDivider />

        <div className="flex w-full items-center px-1">
          <MemberSelect
            testId="work-item-assignee-select"
            value={issue.assignee_ids ?? []}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
            disabled={disabled}
            projectId={projectId}
            placeholder={t("issue.add.assignee")}
            multiple
            variant="select-ghost-lg"
            multipleLabel={(count) => t("issue.assignee_count", { count })}
            tooltip={{ heading: t("common.assignees") }}
          />
        </div>

        <PropertyDivider />

        <div className="flex w-full items-center px-1">
          <DateSelect
            testId="work-item-start-date-select"
            placeholder={t("common.order_by.start_date")}
            value={getDate(issue.start_date) ?? null}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            maxDate={maxDate}
            disabled={disabled}
            clearable
            icon={<StartDateOutline />}
            weekStartsOn={userProfile?.start_of_the_week}
            variant="select-ghost-lg"
            showTooltip
            tooltipHeading={t("common.order_by.start_date")}
          />
        </div>

        <PropertyDivider />

        <div className="flex w-full items-center px-1">
          <DateSelect
            testId="work-item-due-date-select"
            placeholder={t("common.order_by.due_date")}
            value={getDate(issue.target_date) ?? null}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                target_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            minDate={minDate}
            disabled={disabled}
            clearable
            className={getIssueDueDateClassName(issue.target_date, stateDetails?.group)}
            icon={<DueDateOutline />}
            weekStartsOn={userProfile?.start_of_the_week}
            variant="select-ghost-lg"
            showTooltip
            tooltipHeading={t("common.order_by.due_date")}
          />
        </div>
      </div>
    </div>
  );
});
