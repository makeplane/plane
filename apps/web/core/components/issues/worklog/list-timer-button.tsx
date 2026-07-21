/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { observer } from "mobx-react";
import { Play, Square } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useWorklogTimerAllowed } from "@/hooks/use-worklog-timer-allowed";

const POPUP_WIDTH = 288; // w-72

type TWorkItemTimerButton = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  assigneeIds?: string[];
  stateId?: string | null;
  disabled?: boolean;
};

// Compact Start/Stop timer toggle rendered inline in list/board rows next to the state dropdown.
export const WorkItemTimerButton = observer(function WorkItemTimerButton(props: TWorkItemTimerButton) {
  const { workspaceSlug, projectId, issueId, assigneeIds, stateId, disabled = false } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { data: currentUser } = useUser();
  const { worklog } = useIssueDetail();
  const timerAllowed = useWorklogTimerAllowed(projectId, stateId);
  const [busy, setBusy] = useState(false);
  const [popup, setPopup] = useState<{ top: number; left: number } | null>(null);
  const [description, setDescription] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // focus the description field when the stop popup opens
  useEffect(() => {
    if (popup) textareaRef.current?.focus();
  }, [popup]);

  // load the user's single running timer once (deduped in the store) so rows reflect it
  useEffect(() => {
    if (workspaceSlug) worklog.fetchUserActiveTimer(workspaceSlug);
  }, [workspaceSlug, worklog]);

  // close the stop popup on outside click
  useEffect(() => {
    if (!popup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (popupRef.current?.contains(target) || btnRef.current?.contains(target)) return;
      setPopup(null);
    };
    const id = window.setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [popup]);

  const isAssigned = assigneeIds && currentUser?.id ? assigneeIds.includes(currentUser.id) : false;
  if (!isAssigned) return null;

  const activeTimer = worklog.getActiveTimerForIssue(issueId);
  // hide entirely when no timer is running and the state doesn't allow starting one
  if (!activeTimer && !timerAllowed) return null;

  const handleClick = async (e: SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (disabled || busy) return;
    if (activeTimer) {
      // running → open the stop popup so a description can be entered (matches the detail view)
      const r = btnRef.current?.getBoundingClientRect();
      if (r) {
        const margin = 12;
        // center the popup on the button, then keep it within the viewport with a margin
        const left = Math.max(
          margin,
          Math.min(r.left + r.width / 2 - POPUP_WIDTH / 2, window.innerWidth - POPUP_WIDTH - margin)
        );
        setPopup({ top: r.bottom + 6, left });
      }
      setDescription("");
    } else {
      setBusy(true);
      try {
        await worklog.startTimer(workspaceSlug, projectId, issueId);
      } finally {
        setBusy(false);
      }
    }
  };

  const handleStop = async (e: SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await worklog.stopTimer(workspaceSlug, projectId, issueId, { description: description.trim() || undefined });
      setPopup(null);
      setDescription("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Tooltip tooltipContent={activeTimer ? t("common.stop_timer") : t("common.start_timer")} isMobile={isMobile}>
        <button
          ref={btnRef}
          type="button"
          onClick={handleClick}
          disabled={disabled || busy}
          className={cn(
            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-strong text-tertiary transition-colors hover:bg-layer-1",
            {
              "border-danger-strong text-danger-primary": !!activeTimer,
              "cursor-not-allowed opacity-60": disabled || busy,
            }
          )}
        >
          {activeTimer ? <Square className="h-2.5 w-2.5 fill-current" /> : <Play className="h-2.5 w-2.5" />}
        </button>
      </Tooltip>

      {/* rendered inline (not portaled) so theme CSS vars resolve; position:fixed escapes row clipping */}
      {popup && (
        <div
          ref={popupRef}
          role="dialog"
          aria-modal
          style={{ position: "fixed", top: popup.top, left: popup.left, width: POPUP_WIDTH }}
          // the row is an <a> (ControlLink); stop + prevent so clicks inside don't navigate to the work item
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Escape") {
              setPopup(null);
              setDescription("");
            }
          }}
          className="z-30 rounded-lg border border-subtle bg-surface-1 p-3 shadow-raised-200"
        >
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t("common.worklog_description_placeholder")}
            className="text-sm w-full resize-none rounded border border-subtle bg-surface-2 p-2 text-primary outline-none focus:border-accent-strong"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPopup(null);
                setDescription("");
              }}
              disabled={busy}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="sm" onClick={handleStop} disabled={busy}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
});
