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

export function UnderlineFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 14C2 13.6318 2.29848 13.3333 2.66667 13.3333H13.3333C13.7015 13.3333 14 13.6318 14 14C14 14.3682 13.7015 14.6667 13.3333 14.6667H2.66667C2.29848 14.6667 2 14.3682 2 14Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 2C4.36819 2 4.66667 2.29848 4.66667 2.66667V7.33333C4.66667 9.17428 6.15905 10.6667 8 10.6667C9.84095 10.6667 11.3333 9.17428 11.3333 7.33333V2.66667C11.3333 2.29848 11.6318 2 12 2C12.3682 2 12.6667 2.29848 12.6667 2.66667V7.33333C12.6667 9.91066 10.5773 12 8 12C5.42267 12 3.33333 9.91066 3.33333 7.33333V2.66667C3.33333 2.29848 3.63181 2 4 2Z"
        fill={color}
      />
    </IconWrapper>
  );
}
