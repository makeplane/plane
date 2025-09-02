"use client";

import { useEffect, useState } from "react";
import { webContents } from "@todesktop/client-core";
import { observer } from "mobx-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "@plane/utils";

export const DesktopAppNavigation = observer(() => {
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
      unsubscribeNavigationEvent && unsubscribeNavigationEvent();
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
    "size-6 flex items-center justify-center rounded cursor-pointer text-custom-text-300";

  return (
    <div className="flex">
      <Tooltip tooltipContent="Go back" position="bottom">
        <button
          onClick={() => handleNavigation("backward")}
          className={cn(commonNavigationButtonClasses, {
            "text-custom-text-400 opacity-70 cursor-not-allowed": isBackwardNavigationDisabled,
            "hover:bg-custom-background-90 hover:text-custom-text-200": !isBackwardNavigationDisabled,
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
            "text-custom-text-400 opacity-70 cursor-not-allowed": isForwardNavigationDisabled,
            "hover:bg-custom-background-90 hover:text-custom-text-200": !isForwardNavigationDisabled,
          })}
          disabled={isForwardNavigationDisabled}
        >
          <ArrowRight className="size-4" strokeWidth={2.5} />
        </button>
      </Tooltip>
    </div>
  );
});
