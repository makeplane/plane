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

import type { ReactNode } from "react";
import { cn } from "@plane/utils";

export type EntityDetailLayoutProps = {
  mainContent: ReactNode;
  sidebarContent: ReactNode;
  isSidebarOpen?: boolean;
  headerElement?: ReactNode;
};

export function EntityDetailLayout(props: EntityDetailLayoutProps) {
  const { mainContent, sidebarContent, isSidebarOpen = true, headerElement } = props;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {headerElement}
      <div className="relative flex h-full w-full overflow-hidden">
        <div className="h-full w-full min-w-0 flex-1 overflow-y-auto px-8 bg-surface-1">{mainContent}</div>
        <div
          className={cn(
            "fixed right-0 z-[5] h-full w-full min-w-[300px] shrink-0 border-l border-subtle bg-surface-1 sm:w-1/2 md:relative md:w-1/4 lg:min-w-80 xl:min-w-95",
            !isSidebarOpen && "hidden"
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </div>
  );
}
