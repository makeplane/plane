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

import type { ISvgIcons } from "./type";

export function ResizeGripIcon({ className = "text-current", ...rest }: ISvgIcons) {
  return (
    <svg viewBox="0 0 6 6" className={className} xmlns="http://www.w3.org/2000/svg" {...rest}>
      <line x1="5" y1="0.5" x2="0.5" y2="5" stroke="currentColor" strokeWidth="0.75" />
      <line x1="5" y1="3" x2="3" y2="5" stroke="currentColor" strokeWidth="0.75" />
    </svg>
  );
}
