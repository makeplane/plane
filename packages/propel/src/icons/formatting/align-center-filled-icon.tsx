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

export function AlignCenterFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M2.00016 3.33301C1.63197 3.33301 1.3335 3.63148 1.3335 3.99967C1.3335 4.36786 1.63197 4.66634 2.00016 4.66634H14.0002C14.3684 4.66634 14.6668 4.36786 14.6668 3.99967C14.6668 3.63148 14.3684 3.33301 14.0002 3.33301H2.00016Z"
        fill={color}
      />
      <path
        d="M4.00016 5.99967C3.63197 5.99967 3.3335 6.29815 3.3335 6.66634C3.3335 7.03453 3.63197 7.33301 4.00016 7.33301H12.0002C12.3684 7.33301 12.6668 7.03453 12.6668 6.66634C12.6668 6.29815 12.3684 5.99967 12.0002 5.99967H4.00016Z"
        fill={color}
      />
      <path
        d="M1.3335 9.33301C1.3335 8.96482 1.63197 8.66634 2.00016 8.66634H14.0002C14.3684 8.66634 14.6668 8.96482 14.6668 9.33301C14.6668 9.7012 14.3684 9.99967 14.0002 9.99967H2.00016C1.63197 9.99967 1.3335 9.7012 1.3335 9.33301Z"
        fill={color}
      />
      <path
        d="M4.00016 11.333C3.63197 11.333 3.3335 11.6315 3.3335 11.9997C3.3335 12.3679 3.63197 12.6663 4.00016 12.6663H12.0002C12.3684 12.6663 12.6668 12.3679 12.6668 11.9997C12.6668 11.6315 12.3684 11.333 12.0002 11.333H4.00016Z"
        fill={color}
      />
    </IconWrapper>
  );
}
