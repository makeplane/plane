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

import type { FC } from "react";
import React from "react";
// utils
import { cn } from "@plane/utils";

type TSidebarWrapperProps = {
  children: React.ReactNode;
  isSidebarOpen: boolean;
};

export function SidebarWrapper(props: TSidebarWrapperProps) {
  const { children, isSidebarOpen } = props;
  return (
    <div
      className={cn(
        `absolute right-0 flex flex-col gap-4 h-full border-l border-subtle bg-surface-1 p-6 sm:relative transition-[width] ease-linear`,
        {
          "w-0 hidden": !isSidebarOpen,
          "min-w-90 w-full sm:w-1/2  md:w-1/3 lg:min-w-80 xl:min-w-96": isSidebarOpen,
        }
      )}
      style={!isSidebarOpen ? { right: `-${window?.innerWidth || 0}px` } : {}}
    >
      {children}
    </div>
  );
}
