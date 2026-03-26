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

import { cn } from "@plane/utils";
import { TIMELINE_CONNECTOR_WIDTH } from "./constants";

export type TimelineConnectorProps = {
  size?: "sm" | "md";
  className?: string;
};

const sizeStyles = {
  sm: "h-2",
  md: "h-6",
};

export function TimelineConnector(props: TimelineConnectorProps) {
  const { size = "md", className } = props;

  return (
    <div className={cn(`flex ${TIMELINE_CONNECTOR_WIDTH} justify-center`, sizeStyles[size], className)}>
      <div className="h-full w-px bg-layer-3" />
    </div>
  );
}
