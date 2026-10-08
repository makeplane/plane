/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TStartTimerPayload, TTimeEntry } from "@plane/types";
import { formatTimeDuration } from "@plane/utils";
// components
import { getEntryTitle, getTimeTrackingErrorMessage } from "@/components/time-tracking/helpers";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
// store
import { isStaleTimerError } from "@/store/time-tracking/timer.store";

/**
 * Start, stop and discard the timer with the standard toasts. Every timer entry point
 * (top bar, work item, quick actions, Power K) goes through here so they behave the same.
 */
export const useTimerActions = (workspaceSlugOverride?: string) => {
  const params = useParams();
  const workspaceSlug = workspaceSlugOverride ?? params.workspaceSlug?.toString();
  const { t } = useTranslation();
  const timer = useTimer();

  const showError = useCallback(
    (error: unknown) => {
      setToast({
        type: isStaleTimerError(error) ? TOAST_TYPE.INFO : TOAST_TYPE.ERROR,
        title: isStaleTimerError(error)
          ? t("time-tracking.toasts.timer_stopped_elsewhere")
          : getTimeTrackingErrorMessage(t, error),
      });
    },
    [t]
  );

  const showLogged = useCallback(
    (entry: TTimeEntry) => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("time-tracking.toasts.logged", {
          duration: formatTimeDuration(entry.duration_seconds),
          name: entry.issue_detail
            ? `${entry.issue_detail.project_identifier}-${entry.issue_detail.sequence_id}`
            : getEntryTitle(entry),
        }),
        actionItems: (
          <button
            type="button"
            className="text-13 font-medium text-accent-primary hover:underline"
            onClick={() => timer.openLogTimeModal({ entry })}
          >
            {t("time-tracking.toasts.edit")}
          </button>
        ),
      });
    },
    [t, timer]
  );

  const showDiscarded = useCallback(
    () => setToast({ type: TOAST_TYPE.INFO, title: t("time-tracking.toasts.timer_discarded") }),
    [t]
  );

  const start = useCallback(
    async (payload: TStartTimerPayload) => {
      if (!workspaceSlug) return;
      try {
        const response = await timer.startTimer(workspaceSlug, payload);
        if (response.stopped) showLogged(response.stopped);
        else if (response.stopped_discarded) showDiscarded();
        return response;
      } catch (error) {
        showError(error);
      }
    },
    [workspaceSlug, timer, showLogged, showDiscarded, showError]
  );

  const stop = useCallback(
    async (description?: string) => {
      if (!workspaceSlug) return;
      try {
        const response = await timer.stopTimer(workspaceSlug, description);
        if (response.entry) showLogged(response.entry);
        else if (response.discarded) showDiscarded();
        return response;
      } catch (error) {
        showError(error);
      }
    },
    [workspaceSlug, timer, showLogged, showDiscarded, showError]
  );

  const discard = useCallback(async () => {
    if (!workspaceSlug) return;
    try {
      await timer.discardTimer(workspaceSlug);
    } catch (error) {
      showError(error);
    }
  }, [workspaceSlug, timer, showError]);

  /** start on a work item, or stop when the timer already runs on it */
  const toggleOnIssue = useCallback(
    async (projectId: string, issueId: string) =>
      timer.isRunningOnIssue(issueId) ? stop() : start({ project_id: projectId, issue_id: issueId }),
    [timer, start, stop]
  );

  return { start, stop, discard, toggleOnIssue, showError };
};
