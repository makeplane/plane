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

type TLayoutRootProps = {
  children: React.ReactNode;
  className?: string;
  emptyStateComponent?: React.ReactNode;
  renderEmptyState?: boolean;
};

export function LayoutRoot(props: TLayoutRootProps) {
  const { children, className = "", renderEmptyState, emptyStateComponent } = props;
  return (
    <div className={cn("relative flex h-full w-full overflow-hidden", className)}>
      {renderEmptyState ? emptyStateComponent : children}
    </div>
  );
}
