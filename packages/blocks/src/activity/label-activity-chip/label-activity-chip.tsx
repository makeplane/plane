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

import { Tooltip } from "@plane/propel/tooltip";

export type LabelActivityChipProps = {
  name?: string;
  color?: string;
};

export function LabelActivityChip(props: LabelActivityChipProps) {
  const { name, color } = props;
  return (
    <Tooltip tooltipContent={name}>
      <span className="inline-flex w-min max-w-32 cursor-default flex-shrink-0 items-center gap-2 truncate whitespace-nowrap rounded-full border border-strong px-2 py-0.5 text-11">
        <span
          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: color ?? "rgb(var(--txt-icon-primary))",
          }}
          aria-hidden="true"
        />
        <span className="flex-shrink truncate font-medium text-primary">{name}</span>
      </span>
    </Tooltip>
  );
}
