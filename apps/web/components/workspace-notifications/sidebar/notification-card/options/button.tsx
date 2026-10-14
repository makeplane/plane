/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// helpers
import { cn } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationItemOptionButton = {
  tooltipContent?: string;
  buttonClassName?: string;
  callBack: () => void;
  children: ReactNode;
};

export function NotificationItemOptionButton(props: TNotificationItemOptionButton) {
  const { tooltipContent = "", buttonClassName = "", children, callBack } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip label={tooltipContent} layout="stacked" disabled={isMobile}>
      <button
        type="button"
        className={cn(
          "relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-xs bg-layer-1 outline-none hover:bg-surface-2",
          buttonClassName
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          callBack && callBack();
        }}
      >
        {children}
      </button>
    </Tooltip>
  );
}
