/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useState } from "react";
import { webContents } from "@todesktop/client-core";
import { observer } from "mobx-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "@plane/utils";

export const DesktopAppNavigation = observer(function DesktopAppNavigation() {
  // states
  const [isForwardNavigationDisabled, setIsForwardNavigationDisabled] = useState<boolean>(true);
  const [isBackwardNavigationDisabled, setIsBackwardNavigationDisabled] = useState<boolean>(true);

  // handle navigation
  useEffect(() => {
    let unsubscribeNavigationEvent: () => Promise<void> | undefined;

    const observerNavigationEvents = async () => {
      unsubscribeNavigationEvent = await webContents.on("navigate", async () => {
        if (await webContents.canGoForward()) {
          setIsForwardNavigationDisabled(false);
        } else {
          setIsForwardNavigationDisabled(true);
        }
        if (await webContents.canGoBack()) {
          setIsBackwardNavigationDisabled(false);
        } else {
          setIsBackwardNavigationDisabled(true);
        }
      });
    };

    observerNavigationEvents();

    return () => {
      if (!unsubscribeNavigationEvent) return;
      unsubscribeNavigationEvent();
    };
  }, []);

  const handleNavigation = async (direction: "forward" | "backward") => {
    // TODO: check API documentation sdk for this method
    if (direction === "forward") {
      if (await webContents.canGoForward()) {
        (window as any).todesktop.contents.goForward();
      }
    } else {
      if (await webContents.canGoBack()) {
        (window as any).todesktop.contents.goBack();
      }
    }
  };

  const commonNavigationButtonClasses =
    "size-6 flex items-center justify-center rounded-sm cursor-pointer text-tertiary";

  return (
    <div className="flex">
      <Tooltip tooltipContent="Go back" position="bottom">
        <button
          onClick={() => handleNavigation("backward")}
          className={cn(commonNavigationButtonClasses, {
            "text-placeholder opacity-70 cursor-not-allowed": isBackwardNavigationDisabled,
            "hover:bg-layer-1 hover:text-secondary": !isBackwardNavigationDisabled,
          })}
          disabled={isBackwardNavigationDisabled}
        >
          <ArrowLeft className="size-4" strokeWidth={2.5} />
        </button>
      </Tooltip>
      <Tooltip tooltipContent="Go forward" position="bottom">
        <button
          onClick={() => handleNavigation("forward")}
          className={cn(commonNavigationButtonClasses, {
            "text-placeholder opacity-70 cursor-not-allowed": isForwardNavigationDisabled,
            "hover:bg-layer-1 hover:text-secondary": !isForwardNavigationDisabled,
          })}
          disabled={isForwardNavigationDisabled}
        >
          <ArrowRight className="size-4" strokeWidth={2.5} />
        </button>
      </Tooltip>
    </div>
  );
});
