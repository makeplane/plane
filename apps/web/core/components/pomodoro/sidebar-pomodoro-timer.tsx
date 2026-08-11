/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useNavigate, useParams } from "react-router";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// lucide
import { Coffee, Timer } from "lucide-react";
// hooks
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";
// local imports
import { PomodoroCountdown } from "./pomodoro-countdown";
import { PomodoroControls } from "./pomodoro-controls";

/** Compact timer in the Projects sidebar footer. */
export const SidebarPomodoroTimer = observer(function SidebarPomodoroTimer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { workspaceSlug } = useParams();
  const {
    activeTimer,
    phase,
    isBreak,
    isNextSessionReady,
    hasActiveTimer,
    focusIssueId,
    focusIssueName,
    focusProjectId,
    remainingSeconds,
  } = usePomodoroTimer();

  const showWidget = hasActiveTimer || isBreak || isNextSessionReady;
  if (!showWidget) return null;

  const phaseLabel = isBreak
    ? phase === "long-break"
      ? t("pomodoro.long_break")
      : t("pomodoro.short_break")
    : t("pomodoro.focus");

  const PhaseIcon = isBreak ? Coffee : Timer;
  const controlIssueId = activeTimer?.issue ?? focusIssueId ?? undefined;
  const issueName = activeTimer?.issue_detail?.name ?? focusIssueName;
  const projectId = activeTimer?.project ?? focusProjectId;
  const issueId = activeTimer?.issue ?? focusIssueId;
  const projectIdentifier = activeTimer?.project_detail?.identifier;
  const sequenceId = activeTimer?.issue_detail?.sequence_id;
  const issueLabel =
    issueName && projectIdentifier && sequenceId != null
      ? `${projectIdentifier}-${sequenceId} ${issueName}`
      : issueName;

  const goToIssue = () => {
    if (!workspaceSlug || !projectId || !issueId) return;
    navigate(`/${workspaceSlug}/projects/${projectId}/issues/${issueId}/`);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div className="flex items-center gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1 py-0.5">
          <span
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-full",
              isBreak ? "bg-violet-500/15 text-violet-500" : "bg-accent-subtle text-accent-primary"
            )}
          >
            <PhaseIcon className="size-2.5" />
          </span>
          <PomodoroCountdown seconds={remainingSeconds} size="sm" />
          <span className="shrink-0 text-11 text-secondary">{phaseLabel}</span>
        </div>
        <PomodoroControls compact issueId={controlIssueId} />
      </div>

      {issueLabel ? (
        <button
          type="button"
          onClick={goToIssue}
          disabled={!projectId || !issueId}
          className="min-w-0 truncate rounded-sm px-1 py-0.5 text-left text-11 text-primary hover:bg-layer-transparent-hover disabled:cursor-default disabled:hover:bg-transparent"
          title={issueLabel}
          aria-label={t("pomodoro.open_work_item")}
        >
          {issueLabel}
        </button>
      ) : null}
    </div>
  );
});
