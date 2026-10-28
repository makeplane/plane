/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { IconButton } from "@makeplane/propel/components/icon-button";
// helpers
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationItemOptionButton = {
  tooltipContent?: string;
  callBack: () => void;
  children: ReactNode;
};

export function NotificationItemOptionButton(props: TNotificationItemOptionButton) {
  const { tooltipContent = "", children, callBack } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <IconButton
      variant="ghost"
      size="xs"
      aria-label={tooltipContent}
      showTooltip={!isMobile}
      icon={children}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        callBack();
      }}
    />
  );
}
