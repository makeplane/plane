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

import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function AlignCenterIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M12 11.375C12.3452 11.375 12.625 11.6548 12.625 12C12.625 12.3452 12.3452 12.625 12 12.625H4C3.65482 12.625 3.375 12.3452 3.375 12C3.375 11.6548 3.65482 11.375 4 11.375H12ZM14 8.70801C14.3451 8.70801 14.6248 8.98798 14.625 9.33301C14.625 9.67819 14.3452 9.95801 14 9.95801H2C1.65482 9.95801 1.375 9.67819 1.375 9.33301C1.37518 8.98798 1.65493 8.70801 2 8.70801H14ZM12 6.04199C12.3452 6.04199 12.625 6.32181 12.625 6.66699C12.6248 7.01202 12.3451 7.29199 12 7.29199H4C3.65493 7.29199 3.37518 7.01202 3.375 6.66699C3.375 6.32181 3.65482 6.04199 4 6.04199H12ZM14 3.375C14.3452 3.375 14.625 3.65482 14.625 4C14.625 4.34518 14.3452 4.625 14 4.625H2C1.65482 4.625 1.375 4.34518 1.375 4C1.375 3.65482 1.65482 3.375 2 3.375H14Z"
        fill={color}
      />
    </IconWrapper>
  );
}
