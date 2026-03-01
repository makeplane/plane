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

type TMainWrapperProps = {
  children: React.ReactNode;
  isSidebarOpen: boolean;
  className?: string;
};

export function MainWrapper(props: TMainWrapperProps) {
  const { children, isSidebarOpen, className = "" } = props;
  return (
    <div
      className={cn(
        `flex flex-col h-full w-full overflow-y-auto px-10 py-8`,
        {
          "max-w-2/3": isSidebarOpen,
        },
        className
      )}
    >
      {children}
    </div>
  );
}
