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

type TAttributePillProps = {
  data: string;
  className?: string;
};

export function AttributePill({ data, className }: TAttributePillProps) {
  return (
    <span
      className={cn(
        "flex-shrink-0 w-fit px-2 py-0.5 text-caption-sm-medium text-tertiary bg-layer-1 rounded",
        className
      )}
    >
      {data}
    </span>
  );
}
