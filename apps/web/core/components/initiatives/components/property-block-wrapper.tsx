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
// plane imports
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  children: React.ReactNode;
};

export function PropertyBlockWrapper(props: Props) {
  const { className = "", children } = props;
  return (
    <div className="h-6">
      <div className={cn("h-full text-11 flex items-center gap-2", className)}>{children}</div>
    </div>
  );
}
