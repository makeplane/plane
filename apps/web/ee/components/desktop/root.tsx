"use client";

import { FC } from "react";
// to desktop
import { isDesktopApp } from "@todesktop/client-core/platform/todesktop";
// mobx
import { observer } from "mobx-react";
// helpers
import { cn } from "@plane/utils";
// desktop app components
import { SidebarToggle, DesktopAppNavigation, useDesktopApp, DesktopAppProvider } from "@/plane-web/components/desktop";

const DesktopAppRoot: FC = observer(() => {
  // store hooks
  const { pageTitle, isFullScreen } = useDesktopApp();

  return (
    <>
      <div className="header fixed top-0 left-0 flex gap-4 items-center w-full h-8">
        <div
          className={cn(
            "flex flex-shrink-0 gap-0.5 items-center justify-end w-[160px] transition-all duration-300 ease-in-out",
            {
              "pl-3 justify-start": isFullScreen,
            }
          )}
        >
          <SidebarToggle />
          <DesktopAppNavigation />
        </div>
        <div className="flex gap-2 grow items-center justify-center">
          {/* page title */}
          <div className="text-xs font-semibold text-custom-text-300 truncate">{pageTitle}</div>
        </div>
        <div className="w-[70px] flex flex-shrink-0 items-center justify-start" />
      </div>
    </>
  );
});

export const DesktopAppProviderRoot: FC = observer(() => {
  if (!isDesktopApp()) return null;

  return (
    <DesktopAppProvider>
      <DesktopAppRoot />
    </DesktopAppProvider>
  );
});
