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

export type DotSeparatorProps = { className?: string };

export function DotSeparator({ className }: DotSeparatorProps) {
  return <span className={cn("size-1 shrink-0 rounded-full bg-layer-disabled", className)} aria-hidden="true" />;
}
