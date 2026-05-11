/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IssueDetailWidgetButton } from "@/components/issues/issue-detail-widgets/widget-button";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { WorklogModal } from "./worklog-modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const LogTimeActionButton = observer(function LogTimeActionButton(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getProjectById } = useProject();
  const { getStateById } = useProjectState();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { data: currentUser } = useUser();

  const issue = issueId ? getIssueById(issueId) : undefined;
  const project = getProjectById(projectId);
  const role = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isAdmin = role === EUserPermissions.ADMIN;
  const isGuest = role === EUserPermissions.GUEST;
  const isAssigned = !!(issue?.assignee_ids && currentUser?.id && issue.assignee_ids.includes(currentUser.id));
  const isTimeTrackingEnabled = project?.is_time_tracking_enabled !== false;
  const stateGroup = issue?.state_id ? getStateById(issue.state_id)?.group : undefined;
  const isStateTerminal = stateGroup === "completed" || stateGroup === "cancelled";
  const hasSubIssues = (issue?.sub_issues_count ?? 0) > 0;

  const isEnabled = !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned) && !isStateTerminal && !hasSubIssues;

  if (!isEnabled) return null;

  return (
    <>
      <button type="button" onClick={() => setIsModalOpen(true)} disabled={disabled} className="flex">
        <IssueDetailWidgetButton
          title={t("worklog.log_time")}
          icon={<Timer className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2} />}
          disabled={disabled}
        />
      </button>
      <WorklogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
      />
    </>
  );
});
