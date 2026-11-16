/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane imports
import { TooltipPopup } from "@makeplane/propel/elements/tooltip";

interface TreeMapTooltipProps {
  active: boolean | undefined;
  payload: any[] | undefined;
}

export const TreeMapTooltip = React.memo(function TreeMapTooltip({ active, payload }: TreeMapTooltipProps) {
  if (!active || !payload || !payload[0]?.payload) return null;

  const data = payload[0].payload;

  return (
    <TooltipPopup layout="stacked" render={<div className="w-full" />}>
      <div className="flex w-full items-center gap-2 border-b border-subtle pb-2.5">
        {data?.icon}
        <p className="text-caption-sm-medium text-primary capitalize">{data?.name}</p>
      </div>
      <span className="text-caption-sm-medium text-secondary">
        {data?.value.toLocaleString()}
        {data.label && ` ${data.label}`}
      </span>
    </TooltipPopup>
  );
});

TreeMapTooltip.displayName = "TreeMapTooltip";
