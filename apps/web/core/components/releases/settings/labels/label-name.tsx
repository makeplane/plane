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
import { cn } from "@plane/utils";

type Props = {
  name: string;
  color: string;
  className?: string;
};

export const ReleaseLabelName: FC<Props> = ({ name, color, className }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <span className="size-3.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
    <span className="text-body-sm-medium text-primary">{name}</span>
  </div>
);
