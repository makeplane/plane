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

type TSectionWrapperProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionWrapper(props: TSectionWrapperProps) {
  const { children, className = "" } = props;
  return (
    <div className={cn(`flex flex-col gap-4 w-full py-6 first:pt-0 border-b border-subtle last:border-0`, className)}>
      {children}
    </div>
  );
}
