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

export function ToDoListFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M5.52832 9.52832C5.78867 9.26797 6.21133 9.26797 6.47168 9.52832C6.73203 9.78867 6.73203 10.2113 6.47168 10.4717L3.80469 13.1377C3.54434 13.398 3.12265 13.398 2.8623 13.1377L1.52832 11.8047C1.26824 11.5444 1.26835 11.1226 1.52832 10.8623C1.78867 10.602 2.21133 10.602 2.47168 10.8623L3.33301 11.7236L5.52832 9.52832ZM14 12C14.3682 12 14.667 12.2988 14.667 12.667C14.6668 13.035 14.3681 13.333 14 13.333H8.66699C8.29891 13.333 8.00018 13.035 8 12.667C8 12.2988 8.2988 12 8.66699 12H14ZM14 7.33301C14.3682 7.33301 14.667 7.63181 14.667 8C14.667 8.36819 14.3682 8.66699 14 8.66699H8.66699C8.2988 8.66699 8 8.36819 8 8C8 7.63181 8.2988 7.33301 8.66699 7.33301H14ZM5.33301 2C6.06928 2 6.66682 2.59678 6.66699 3.33301V6C6.66699 6.73638 6.06939 7.33301 5.33301 7.33301H2.66699C1.93061 7.33301 1.33301 6.73638 1.33301 6V3.33301C1.33318 2.59678 1.93072 2 2.66699 2H5.33301ZM14 2.66699C14.3681 2.66699 14.6668 2.96497 14.667 3.33301C14.667 3.7012 14.3682 4 14 4H8.66699C8.2988 4 8 3.7012 8 3.33301C8.00018 2.96497 8.29891 2.66699 8.66699 2.66699H14Z"
        fill={color}
      />
    </IconWrapper>
  );
}
