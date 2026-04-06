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

export type EntityDetailPrimaryPropertiesProps = {
  children: ReactNode;
};

export type PropertyDividerProps = {
  className?: string;
};

export function EntityDetailPrimaryProperties(props: EntityDetailPrimaryPropertiesProps) {
  const { children } = props;

  return (
    <div className="flex w-full flex-wrap items-center gap-y-2 py-0.5 rounded-lg [&>*:not([data-divider])]:flex-1 [&>*:not([data-divider])]:min-w-24">
      {children}
    </div>
  );
}

export function PropertyDivider(props: PropertyDividerProps) {
  const { className } = props;

  return <div data-divider className={cn("h-7 border-l border-subtle shrink-0 gap-0.5", className)} />;
}
