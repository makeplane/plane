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

export function TodoListFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <g transform="translate(1.3328, 2.0000)">
        <path
          d="M4.19531 7.52832C4.45566 7.26797 4.87832 7.26797 5.13867 7.52832C5.39902 7.78867 5.39902 8.21133 5.13867 8.47168L2.47168 11.1377C2.21133 11.398 1.78965 11.398 1.5293 11.1377L0.195312 9.80469C-0.064766 9.54443 -0.0646572 9.12263 0.195312 8.8623C0.455662 8.60196 0.878322 8.60196 1.13867 8.8623L2 9.72363L4.19531 7.52832ZM12.667 10C13.0352 10 13.334 10.2988 13.334 10.667C13.3338 11.035 13.0351 11.333 12.667 11.333H7.33398C6.9659 11.333 6.66717 11.035 6.66699 10.667C6.66699 10.2988 6.96579 10 7.33398 10H12.667ZM12.667 5.33301C13.0352 5.33301 13.334 5.63181 13.334 6C13.334 6.36819 13.0352 6.66699 12.667 6.66699H7.33398C6.96579 6.66699 6.66699 6.36819 6.66699 6C6.66699 5.63181 6.96579 5.33301 7.33398 5.33301H12.667ZM4 0C4.73627 0 5.33381 0.596778 5.33398 1.33301V4C5.33398 4.73638 4.73638 5.33301 4 5.33301H1.33398C0.597605 5.33301 1.28821e-07 4.73638 0 4V1.33301C0.000175809 0.596778 0.597713 0 1.33398 0H4ZM12.667 0.666992C13.0351 0.666993 13.3338 0.964968 13.334 1.33301C13.334 1.7012 13.0352 2 12.667 2H7.33398C6.96579 2 6.66699 1.7012 6.66699 1.33301C6.66717 0.964968 6.9659 0.666992 7.33398 0.666992H12.667Z"
          fill={color}
        />
      </g>
    </IconWrapper>
  );
}
