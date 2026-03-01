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

import { useMemo } from "react";
import { isDesktopApp as isDesktopAppFn } from "@todesktop/client-core/platform/todesktop";
import { observer } from "mobx-react";
// plane imports
import { cn } from "@plane/utils";
// components
import { DesktopSidebarToggle } from "./sidebar-toggle";
import { DesktopAppNavigation } from "./navigation";
import { DesktopAppProvider } from "./context";
import { useDesktopApp } from "./use-desktop-app";

const DesktopHeaderRoot = observer(function DesktopHeaderRoot() {
  // store hooks
  const { isFullScreen } = useDesktopApp();
  // derived values
  const isDesktopApp = useMemo(() => isDesktopAppFn(), []);

  if (!isDesktopApp) return null;
  return (
    <div
      className={cn("flex flex-shrink-0 gap-0.5 transition-all duration-300 ease-in-out", {
        "pl-12": isFullScreen,
        "pl-20": !isFullScreen,
      })}
    >
      <DesktopSidebarToggle />
      <DesktopAppNavigation />
    </div>
  );
});

export const DesktopHeaderProvider = observer(function DesktopHeaderProvider() {
  return (
    <DesktopAppProvider>
      <DesktopHeaderRoot />
    </DesktopAppProvider>
  );
});
