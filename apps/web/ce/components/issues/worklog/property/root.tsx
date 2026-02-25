/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { formatMinutesToDisplay } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { useWorklog } from "@/hooks/store/use-worklog";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const store = useWorklog();

  // fetch worklogs on mount
  useEffect(() => {
    if (workspaceSlug && projectId && issueId) {
      void store.fetchWorklogs(workspaceSlug, projectId, issueId);
    }
  }, [workspaceSlug, projectId, issueId, store]);

  const totalMinutes = store.getTotalMinutesForIssue(issueId);

  if (totalMinutes === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-tertiary">
      <Timer className="h-3.5 w-3.5 flex-shrink-0" />
      <span title={t("worklog.total_logged")}>
        {formatMinutesToDisplay(totalMinutes)}
      </span>
    </div>
  );
});
