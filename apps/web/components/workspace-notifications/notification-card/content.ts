/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { i18nInstance } from "@plane/i18n";
import { replaceUnderscoreIfSnakeCase } from "@plane/utils";
import { formatStoredTime } from "@/components/meetings/time";
import { store } from "@/lib/store-context";
import type { TNotificationContentMap } from "@/components/workspace-notifications/sidebar/notification-card/content";

const label = (key: string) => i18nInstance.t(key);

const changed =
  (key: string) =>
  ({ newValue }: { newValue: string | undefined }) => ({
    action: `${label(key)}:`,
    value: newValue || "—",
    showConnector: false,
  });

// Fields of products and meetings
export const ADDITIONAL_NOTIFICATION_CONTENT_MAP: TNotificationContentMap = {
  participants: () => ({ action: label("meeting.invited"), value: null, showConnector: false }),
  meeting_time: ({ newValue }) => ({
    action: `${label("meeting.rescheduled")}:`,
    value: formatStoredTime(
      newValue ?? "",
      store.user.data?.user_timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      i18nInstance.language
    ),
    showConnector: false,
  }),
  outcome: () => ({ action: label("meeting.history.outcome"), value: null, showConnector: false }),
  location: changed("meeting.history.location"),
  organizer: changed("meeting.history.organizer"),
  product_type: changed("product.history.product_type"),
  product_owner: changed("product.history.product_owner"),
  manual_progress: changed("product.history.manual_progress"),
  status_comment: changed("product.history.status_comment"),
  kind: ({ newValue }) => ({
    action: `${label("product.history.kind")}:`,
    value: label(`product.kinds.${newValue}`),
    showConnector: false,
  }),
};

// Fallback action renderer for fields not in the map
export const renderAdditionalAction = (notificationField: string, verb: string | undefined) => {
  const baseAction = !["comment", "archived_at"].includes(notificationField) ? verb : "";
  return `${baseAction} ${replaceUnderscoreIfSnakeCase(notificationField)}`;
};

// Fallback value renderer for fields not in the map
export const renderAdditionalValue = (
  _notificationField: string | undefined,
  newValue: string | undefined,
  _oldValue: string | undefined
) => newValue;

export const shouldShowConnector = (notificationField: string | undefined) =>
  !["comment", "archived_at", "None", "assignees", "labels", "start_date", "target_date", "parent"].includes(
    notificationField || ""
  );

export const shouldRender = (notificationField: string | undefined, verb: string | undefined) => verb !== "deleted";
