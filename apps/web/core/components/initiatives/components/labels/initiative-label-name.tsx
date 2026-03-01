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
import { cn } from "@plane/utils";

type InitiativeLabelNameProps = {
  name: string;
  color: string;
  className?: string;
};

export function InitiativeLabelName(props: InitiativeLabelNameProps) {
  const { name, color, className = "" } = props;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="h-2 w-2 flex-shrink-0 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />
      <span className="text-13 font-medium text-primary">{name}</span>
    </div>
  );
}
