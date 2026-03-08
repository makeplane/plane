/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { cn } from "../utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  noMargin?: boolean;
};

function SubHeading({ children, className, noMargin }: Props) {
  return (
    <h3 className={cn("text-18 font-medium text-secondary block leading-7", !noMargin && "mb-2", className)}>
      {children}
    </h3>
  );
}

export { SubHeading };
