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

export function AlignRightFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66667 6.66634C4.66667 6.29815 4.96514 5.99967 5.33333 5.99967H14C14.3682 5.99967 14.6667 6.29815 14.6667 6.66634C14.6667 7.03453 14.3682 7.33301 14 7.33301H5.33333C4.96514 7.33301 4.66667 7.03453 4.66667 6.66634Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 3.99967C2 3.63148 2.29848 3.33301 2.66667 3.33301H14C14.3682 3.33301 14.6667 3.63148 14.6667 3.99967C14.6667 4.36786 14.3682 4.66634 14 4.66634H2.66667C2.29848 4.66634 2 4.36786 2 3.99967Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 9.33301C2 8.96482 2.29848 8.66634 2.66667 8.66634H14C14.3682 8.66634 14.6667 8.96482 14.6667 9.33301C14.6667 9.7012 14.3682 9.99967 14 9.99967H2.66667C2.29848 9.99967 2 9.7012 2 9.33301Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66667 11.9997C4.66667 11.6315 4.96514 11.333 5.33333 11.333H14C14.3682 11.333 14.6667 11.6315 14.6667 11.9997C14.6667 12.3679 14.3682 12.6663 14 12.6663H5.33333C4.96514 12.6663 4.66667 12.3679 4.66667 11.9997Z"
        fill={color}
      />
    </IconWrapper>
  );
}
