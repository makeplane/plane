/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssueServiceType } from "@plane/types";
// components
import { PomodoroTimer } from "@/components/pomodoro/pomodoro-timer";
import { PomodoroSettingsInline } from "@/components/pomodoro/pomodoro-settings-inline";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueServiceType: TIssueServiceType;
};

export const PomodoroCollapsibleContent = observer(function PomodoroCollapsibleContent(props: Props) {
  const { workspaceSlug, projectId, issueId, issueServiceType } = props;
  const { t } = useTranslation();
  const { activeTimer } = usePomodoroTimer();
  const {
    timeLog: { fetchTimeLogs },
  } = useIssueDetail(issueServiceType);

  const isRunningOnAnotherIssue = !!activeTimer && activeTimer.issue !== issueId && activeTimer.status !== "completed";

  return (
    <div className="flex flex-col gap-3 px-3.5 py-3">
      {isRunningOnAnotherIssue && (
        <p className="flex items-center gap-1.5 text-[11px] text-secondary">
          {t("pomodoro.running_on", {
            issue: activeTimer?.issue_detail?.name ?? t("pomodoro.another_work_item"),
          })}
        </p>
      )}
      <PomodoroTimer issueId={issueId} onTimeLogCreated={() => void fetchTimeLogs(workspaceSlug, projectId, issueId)} />
      <PomodoroSettingsInline />
    </div>
  );
});
