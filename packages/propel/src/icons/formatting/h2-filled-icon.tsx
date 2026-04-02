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

export function H2FilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M8.33287 7.375C8.67805 7.375 8.95787 7.65482 8.95787 8C8.95787 8.34518 8.67805 8.625 8.33287 8.625H2.99986C2.65468 8.625 2.37486 8.34518 2.37486 8C2.37486 7.65482 2.65468 7.375 2.99986 7.375H8.33287Z"
        fill={color}
      />
      <path
        d="M2.37486 12V4C2.37486 3.65482 2.65468 3.375 2.99986 3.375C3.34504 3.375 3.62486 3.65482 3.62486 4V12C3.62486 12.3452 3.34504 12.625 2.99986 12.625C2.65468 12.625 2.37486 12.3452 2.37486 12Z"
        fill={color}
      />
      <path
        d="M7.7082 12V4C7.7082 3.65482 7.98802 3.375 8.3332 3.375C8.67837 3.375 8.9582 3.65482 8.9582 4V12C8.9582 12.3452 8.67837 12.625 8.3332 12.625C7.98802 12.625 7.7082 12.3452 7.7082 12Z"
        fill={color}
      />
      <path
        d="M13.7085 7.99979C13.7084 7.80544 13.5834 7.60329 13.3023 7.50956C13.0283 7.41823 12.5726 7.4355 12.0415 7.83378C11.7655 8.04062 11.3736 7.9846 11.1665 7.70878C10.9595 7.43271 11.0156 7.04093 11.2915 6.83378C12.0938 6.23205 12.9718 6.08201 13.6978 6.32401C14.4163 6.56365 14.9584 7.19444 14.9585 7.99979C14.9585 8.66586 14.7258 9.15301 14.3677 9.52616C14.049 9.85811 13.6233 10.0977 13.3316 10.2801C13.0063 10.4834 12.7625 10.6598 12.5884 10.8992C12.5002 11.0205 12.4215 11.1726 12.3667 11.3748H14.3335C14.6785 11.375 14.9584 11.6548 14.9585 11.9998C14.9585 12.3449 14.6785 12.6246 14.3335 12.6248H11.6665C11.3214 12.6248 11.0415 12.345 11.0415 11.9998C11.0416 11.2197 11.2399 10.6284 11.5777 10.1639C11.9036 9.71574 12.3271 9.43287 12.6685 9.21952C13.0432 8.98531 13.2842 8.84959 13.4654 8.66093C13.6071 8.51329 13.7085 8.33351 13.7085 7.99979Z"
        fill={color}
      />
    </IconWrapper>
  );
}
