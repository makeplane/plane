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

export function AlignLeftFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 6.66634C1.3335 6.29815 1.63197 5.99967 2.00016 5.99967H10.6668C11.035 5.99967 11.3335 6.29815 11.3335 6.66634C11.3335 7.03453 11.035 7.33301 10.6668 7.33301H2.00016C1.63197 7.33301 1.3335 7.03453 1.3335 6.66634Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 3.99967C1.3335 3.63148 1.63197 3.33301 2.00016 3.33301H13.3335C13.7017 3.33301 14.0002 3.63148 14.0002 3.99967C14.0002 4.36786 13.7017 4.66634 13.3335 4.66634H2.00016C1.63197 4.66634 1.3335 4.36786 1.3335 3.99967Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 9.33301C1.3335 8.96482 1.63197 8.66634 2.00016 8.66634H13.3335C13.7017 8.66634 14.0002 8.96482 14.0002 9.33301C14.0002 9.7012 13.7017 9.99967 13.3335 9.99967H2.00016C1.63197 9.99967 1.3335 9.7012 1.3335 9.33301Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.3335 11.9997C1.3335 11.6315 1.63197 11.333 2.00016 11.333H10.6668C11.035 11.333 11.3335 11.6315 11.3335 11.9997C11.3335 12.3679 11.035 12.6663 10.6668 12.6663H2.00016C1.63197 12.6663 1.3335 12.3679 1.3335 11.9997Z"
        fill={color}
      />
    </IconWrapper>
  );
}
