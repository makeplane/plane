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

import React from "react";
// plane imports
import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
};

export function AutomationDetailsMainContentBlockWrapper(props: TProps) {
  const { children, isSelected, onClick } = props;

  return (
    <div
      className={cn("flex-grow p-4 space-y-2 bg-layer-2 rounded-lg shadow-raised-100 border shadow-raised-100", {
        "border-accent-strong": isSelected,
        "border-subtle": !isSelected,
      })}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
