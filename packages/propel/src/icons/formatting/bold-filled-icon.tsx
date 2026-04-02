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

export function BoldFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.00001 2C3.63182 2 3.33334 2.29848 3.33334 2.66667V13.3333C3.33334 13.7015 3.63182 14 4.00001 14H10C11.841 14 13.3333 12.5076 13.3333 10.6667C13.3333 9.4153 12.6438 8.32499 11.6239 7.75497C12.2661 7.14738 12.6667 6.28714 12.6667 5.33333C12.6667 3.49238 11.1743 2 9.33334 2H4.00001ZM9.33334 7.33333C10.4379 7.33333 11.3333 6.4379 11.3333 5.33333C11.3333 4.22876 10.4379 3.33333 9.33334 3.33333H4.66668V7.33333H9.33334ZM4.66668 8.66667V12.6667H10C11.1046 12.6667 12 11.7712 12 10.6667C12 9.5621 11.1046 8.66667 10 8.66667H4.66668Z"
        fill={color}
      />
    </IconWrapper>
  );
}
