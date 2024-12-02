"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { EmptyStateType } from "@plane/constants";
import { EmptyState } from "@/components/empty-state";
// constants
import { ENotificationTab } from "@/constants/notification";

export const NotificationEmptyState: FC = observer(() => {
  // derived values
  const currentTabEmptyState = ENotificationTab.ALL
    ? EmptyStateType.NOTIFICATION_ALL_EMPTY_STATE
    : EmptyStateType.NOTIFICATION_MENTIONS_EMPTY_STATE;

  return <EmptyState type={currentTabEmptyState} layout="screen-simple" />;
});
