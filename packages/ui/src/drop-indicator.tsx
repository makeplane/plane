/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { cn } from "./utils";

type Props = {
  isVisible: boolean;
  classNames?: string;
};

export function DropIndicator(props: Props) {
  const { isVisible, classNames = "" } = props;

  return (
    <div
      className={cn(
        `relative block h-[2px] w-full before:relative before:top-[-2px] before:left-0 before:block before:h-[6px] before:w-[6px] before:rounded-sm after:relative after:top-[-8px] after:left-[calc(100%-6px)] after:block after:h-[6px] after:w-[6px] after:rounded-sm`,
        {
          "bg-accent-primary before:bg-accent-primary after:bg-accent-primary": isVisible,
        },
        classNames
      )}
    />
  );
}
