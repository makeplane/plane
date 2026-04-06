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

import type { PropertyValue } from "../types";
import { TIMELINE_CONNECTOR_WIDTH } from "../timeline/constants";
import { PropertyValueDisplay } from "./property-value-display";
import { ArrowRightIcon } from "@plane/propel/icons";

export type TransitionRowProps = {
  oldValue: PropertyValue;
  newValue: PropertyValue;
  showConnector?: boolean;
};

export function TransitionRow(props: TransitionRowProps) {
  const { oldValue, newValue, showConnector = true } = props;

  return (
    <div className="flex items-center gap-3">
      {/* Left connector area — matches TimelineItemIcon width so connector aligns */}
      <div className={`relative flex ${TIMELINE_CONNECTOR_WIDTH} self-stretch`}>
        {showConnector && <div className="absolute inset-x-1/2 inset-y-0 w-px bg-layer-3" />}
      </div>

      {/* Content */}
      <div className="flex items-center gap-2">
        <PropertyValueDisplay value={oldValue} variant="old" />
        <ArrowRightIcon className="size-4 shrink-0 text-icon-tertiary" />
        <PropertyValueDisplay value={newValue} variant="new" />
      </div>
    </div>
  );
}
