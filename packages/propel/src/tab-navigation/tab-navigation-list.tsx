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
import { LayoutGroup } from "framer-motion";
import { cn } from "../utils";
import type { TTabNavigationListProps } from "./tab-navigation-types";

export function TabNavigationList({ children, className, ...props }: TTabNavigationListProps) {
  return (
    <LayoutGroup id="tab-navigation">
      <div className={cn("relative flex items-center gap-1 rounded-md", className)} {...props}>
        {children}
      </div>
    </LayoutGroup>
  );
}

TabNavigationList.displayName = "TabNavigationList";
