/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// services
import { WorkspaceNotificationService } from "@/services/workspace-notification.service";

const workspaceNotificationService = new WorkspaceNotificationService();

// Fired when a working-hours timer is auto-stopped, so an open worklog can
// refetch immediately instead of waiting for its own poll.
export const WORKING_HOURS_TIMER_STOPPED_EVENT = "working-hours:timer-stopped";

const POLL_INTERVAL_MS = 30_000;

type Props = { workspaceSlug: string };

/**
 * Workspace-level poller: every ~30s it checks for freshly auto-stopped timers
 * and shows one toast per event, deduplicated by notification id, then marks
 * them read so they are not shown again.
 */
export const WorkingHoursNotificationsPoller = observer(function WorkingHoursNotificationsPoller({
  workspaceSlug,
}: Props) {
  const { t } = useTranslation();
  const seenIds = useRef<Set<string>>(new Set());

  const { data } = useSWR(
    workspaceSlug ? `WORKING_HOURS_NOTIFICATIONS_${workspaceSlug}` : null,
    workspaceSlug ? () => workspaceNotificationService.fetchWorkingHoursNotifications(workspaceSlug) : null,
    { refreshInterval: POLL_INTERVAL_MS, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useEffect(() => {
    if (!data || data.length === 0) return;
    const fresh = data.filter((notification) => !seenIds.current.has(notification.id));
    if (fresh.length === 0) return;

    fresh.forEach((notification) => {
      seenIds.current.add(notification.id);
      setToast({
        type: TOAST_TYPE.INFO,
        title: t("workspace_settings.settings.working_hours.timer_stopped_title"),
        message: notification.message?.text ?? t("workspace_settings.settings.working_hours.timer_stopped_message"),
      });
    });

    void workspaceNotificationService.markWorkingHoursNotificationsRead(
      workspaceSlug,
      fresh.map((notification) => notification.id)
    );

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(WORKING_HOURS_TIMER_STOPPED_EVENT));
    }
  }, [data, workspaceSlug, t]);

  return null;
});
