/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { Clock, Play, Square } from "lucide-react";
import { Button } from "@plane/propel/button";
import { useTranslation } from "@plane/i18n";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
import { useWorklogTimerAllowed } from "@/hooks/use-worklog-timer-allowed";
import { LogWorkPanel } from "./log-work-modal";
import { formatElapsed } from "../utils";

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
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const {
    issue: { getIssueById },
    worklog,
  } = useIssueDetail();

  const [showStopPopup, setShowStopPopup] = useState(false);
  const [description, setDescription] = useState("");
  const [elapsed, setElapsed] = useState("");
  const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const issue = getIssueById(issueId);
  const activeTimer = worklog.getActiveTimerForIssue(issueId);
  const isAssigned = issue?.assignee_ids && currentUser?.id ? issue.assignee_ids.includes(currentUser.id) : false;
  // timers can only be started while the work item is in an allowed state (workspace/project policy)
  const timerAllowed = useWorklogTimerAllowed(projectId, issue?.state_id);

  // update elapsed display every second while timer is running
  useEffect(() => {
    if (!activeTimer?.started_at) {
      setElapsed("");
      return;
    }
    const tick = () => setElapsed(formatElapsed(activeTimer.started_at!));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeTimer?.started_at]);

  // close stop popup on outside click
  useEffect(() => {
    if (!showStopPopup) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowStopPopup(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showStopPopup]);

  const handleStartTimer = async () => {
    if (disabled || !isAssigned) return;
    await worklog.startTimer(workspaceSlug, projectId, issueId);
  };

  const handleStopTimer = async () => {
    await worklog.stopTimer(workspaceSlug, projectId, issueId, { description: description.trim() || undefined });
    setShowStopPopup(false);
    setDescription("");
  };

  return (
    <div className="relative flex shrink-0 items-center gap-2">
      {/* Labels collapse to icon-only on narrow screens so these stay reachable next to
          the tab strip; the accessible name is kept on the button itself. */}
      {/* timer button — only for assignees, and only when the state allows starting a timer */}
      {isAssigned && !activeTimer && timerAllowed && (
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={handleStartTimer}
          className="shrink-0"
          aria-label={t("common.start_timer")}
          title={t("common.start_timer")}
        >
          <Play className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden whitespace-nowrap sm:inline">{t("common.start_timer")}</span>
        </Button>
      )}

      {activeTimer && (
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => setShowStopPopup((v) => !v)}
          className="shrink-0 gap-1.5"
          aria-label={t("common.stop_timer")}
          title={t("common.stop_timer")}
        >
          <span className="font-mono text-xs text-success-primary">{elapsed}</span>
          <Square className="h-3.5 w-3.5 shrink-0 fill-current text-danger-primary" />
          <span className="hidden whitespace-nowrap sm:inline">{t("common.stop_timer")}</span>
        </Button>
      )}

      {/* log work button */}
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => setIsLogWorkOpen(true)}
        className="shrink-0"
        aria-label={t("common.log_work")}
        title={t("common.log_work")}
      >
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden whitespace-nowrap sm:inline">{t("common.log_work")}</span>
      </Button>

      {/* stop popup */}
      {showStopPopup && (
        <div
          ref={popupRef}
          className="absolute top-full right-0 z-20 mt-1 w-72 rounded-lg border border-subtle bg-surface-1 p-3 shadow-raised-200"
        >
          <textarea
            placeholder={t("common.worklog_description_placeholder") || "What did you work on? (optional)"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="text-sm w-full resize-none rounded border border-subtle bg-surface-2 p-2 text-primary outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowStopPopup(false);
                setDescription("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleStopTimer}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}

      {/* log work inline panel */}
      {isLogWorkOpen && (
        <LogWorkPanel
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          onClose={() => setIsLogWorkOpen(false)}
        />
      )}
    </div>
  );
});
