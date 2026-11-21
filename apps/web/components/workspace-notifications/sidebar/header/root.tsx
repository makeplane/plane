/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// plane imports
import { ENotificationLoader, ENotificationQueryParamType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { ArrowLeftOutline, MarkAllReadOutline, RefreshOutline } from "@makeplane/propel/icons";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationSidebarHeader = {
  workspaceSlug: string;
};

export const NotificationSidebarHeader = observer(function NotificationSidebarHeader(
  props: TNotificationSidebarHeader
) {
  const { workspaceSlug } = props;
  // hooks
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const navigate = useNavigate();
  const { loader, getNotifications, markAllNotificationsAsRead } = useWorkspaceNotifications();

  const refreshNotifications = async () => {
    if (loader) return;
    try {
      await getNotifications(workspaceSlug, ENotificationLoader.MUTATION_LOADER, ENotificationQueryParamType.CURRENT);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    // NOTE: We are using loader to prevent continues request when we are making all the notification to read
    if (loader) return;
    try {
      await markAllNotificationsAsRead(workspaceSlug);
    } catch (error) {
      console.error(error);
    }
  };

  // Return to the page the inbox was opened from. React Router stores its history index in
  // `history.state.idx`; at 0 there is no earlier in-app entry (direct visit, reload, or a redirect that
  // replaced the first entry), so fall back to the workspace home instead of leaving Plane.
  const handleBack = () => {
    const historyIndex = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (historyIndex > 0) void navigate(-1);
    else void navigate(`/${workspaceSlug}/`);
  };

  if (!workspaceSlug) return <></>;
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-1">
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Icon icon={ArrowLeftOutline} />}
          aria-label={t("common.go_back")}
          showTooltip={!isMobile}
          onClick={handleBack}
        />
        <h2 className="text-h5-semibold text-primary">{t("notification.label")}</h2>
      </div>
      <div className="flex items-center gap-1">
        {/* mark all notifications as read*/}
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Icon icon={MarkAllReadOutline} />}
          loading={loader === ENotificationLoader.MARK_ALL_AS_READY}
          aria-label={t("notification.options.mark_all_as_read")}
          showTooltip={!isMobile}
          onClick={() => {
            void handleMarkAllNotificationsAsRead();
          }}
        />

        {/* refetch current notifications */}
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Icon icon={RefreshOutline} />}
          loading={loader === ENotificationLoader.MUTATION_LOADER}
          aria-label={t("notification.options.refresh")}
          showTooltip={!isMobile}
          onClick={() => {
            void refreshNotifications();
          }}
        />
      </div>
    </div>
  );
});
