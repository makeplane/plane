/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPomodoroSettings } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { showBrowserPomodoroNotification } from "@/components/pomodoro/notifications";
import { PomodoroTimerService } from "@/services/pomodoro/pomodoro-timer.service";

export const notifyPomodoroPhaseEnd = async (options: {
  phase: "focus" | "break";
  issueName?: string | null;
  settings: TPomodoroSettings;
  /** the timer this phase belongs to — forwarded to the server so it can fan
   * this phase-end out to the user's other devices (APNs alert push) even
   * when this device has no Discord webhook configured. */
  timerId?: string;
}): Promise<void> => {
  const issueSuffix = options.issueName ? ` · ${options.issueName}` : "";
  const title = options.phase === "focus" ? "Focus complete" : "Break over";
  const body =
    options.phase === "focus"
      ? `Focus session finished${issueSuffix}.`
      : `Break finished${issueSuffix}. Time to focus.`;

  if (options.settings.browser_notifications) {
    const shown = await showBrowserPomodoroNotification(title, body);
    if (!shown) {
      setToast({
        type: TOAST_TYPE.INFO,
        title,
        message: body,
      });
    }
  }

  // Always tell the server a phase ended (not gated on Discord being
  // configured) — it's the server that fans this out to other devices via
  // sync_event/apns_push_task; the Discord post is just one thing it may
  // additionally do with it.
  try {
    const service = new PomodoroTimerService();
    await service.notifyPhaseEnd({ phase: options.phase, title, body, timer_id: options.timerId });
  } catch {
    // ignore delivery failures so timer flow is uninterrupted
  }
};
