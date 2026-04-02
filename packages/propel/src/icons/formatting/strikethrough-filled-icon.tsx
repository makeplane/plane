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

export function StrikethroughFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M3.33333 5.33333C3.33333 3.49238 4.82571 2 6.66666 2H9.33333C11.1743 2 12.6667 3.49238 12.6667 5.33333C12.6667 5.70152 12.3682 6 12 6C11.6318 6 11.3333 5.70152 11.3333 5.33333C11.3333 4.22876 10.4379 3.33333 9.33333 3.33333H6.66666C5.56209 3.33333 4.66666 4.22876 4.66666 5.33333C4.66666 5.70152 4.36818 6 3.99999 6C3.6318 6 3.33333 5.70152 3.33333 5.33333Z"
        fill={color}
      />
      <path
        d="M12.0002 8.66667H14C14.3682 8.66667 14.6667 8.36819 14.6667 8C14.6667 7.63181 14.3682 7.33333 14 7.33333H1.99999C1.63181 7.33333 1.33333 7.63181 1.33333 8C1.33333 8.36819 1.63181 8.66667 1.99999 8.66667H9.33333C10.4379 8.66667 11.3333 9.5621 11.3333 10.6667C11.3333 11.7712 10.4379 12.6667 9.33333 12.6667H6.66666C5.56209 12.6667 4.66666 11.7712 4.66666 10.6667C4.66666 10.2985 4.36818 10 3.99999 10C3.6318 10 3.33333 10.2985 3.33333 10.6667C3.33333 12.5076 4.82571 14 6.66666 14H9.33333C11.1743 14 12.6667 12.5076 12.6667 10.6667C12.6667 9.91626 12.4187 9.22377 12.0002 8.66667Z"
        fill={color}
      />
    </IconWrapper>
  );
}
