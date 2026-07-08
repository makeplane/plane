/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorklog } from "@/hooks/store/use-worklog";
// local imports
import { WorklogFormModal } from "./worklog-form-modal";

type TIssueActivityWorklogCreateButton = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueActivityWorklogCreateButton = observer(function IssueActivityWorklogCreateButton(
  props: TIssueActivityWorklogCreateButton
) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { fetchWorklogs } = useWorklog();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // derived values
  const currentProjectDetails = getProjectById(projectId);
  const isTimeTrackingEnabled = Boolean(currentProjectDetails?.is_time_tracking_enabled);

  // load the worklog entries for the work item once (SWR dedups across the sidebar/property call-sites)
  useSWR(
    workspaceSlug && projectId && issueId && isTimeTrackingEnabled
      ? `WORKLOGS_${workspaceSlug}_${projectId}_${issueId}`
      : null,
    workspaceSlug && projectId && issueId && isTimeTrackingEnabled
      ? () => fetchWorklogs(workspaceSlug, projectId, issueId)
      : null
  );

  if (!isTimeTrackingEnabled) return null;

  return (
    <>
      <WorklogFormModal
        isOpen={isModalOpen}
        handleClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
      />
      <Button
        variant="neutral-primary"
        size="sm"
        prependIcon={<Timer className="h-3.5 w-3.5" />}
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        {t("worklog.log_work")}
      </Button>
    </>
  );
});
