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

export function H4Icon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M7.03335 12.0596V4.05957C7.03335 3.71439 7.31317 3.43457 7.65835 3.43457C8.00352 3.43457 8.28335 3.71439 8.28335 4.05957V12.0596C8.28335 12.4047 8.00352 12.6846 7.65835 12.6846C7.31317 12.6846 7.03335 12.4047 7.03335 12.0596Z"
        fill={color}
      />
      <path
        d="M10.3667 8.72624V6.72624C10.3667 6.38106 10.6465 6.10124 10.9917 6.10124C11.3369 6.10124 11.6167 6.38106 11.6167 6.72624V8.72624C11.6167 8.73714 11.6208 8.74775 11.6284 8.75553C11.6362 8.76335 11.6476 8.76823 11.6587 8.76823H13.6587C14.0037 8.7684 14.2837 9.04816 14.2837 9.39323C14.2835 9.73815 14.0036 10.0181 13.6587 10.0182H11.6587C11.3161 10.0182 10.9868 9.88156 10.7446 9.63932C10.5026 9.39712 10.3667 9.06865 10.3667 8.72624Z"
        fill={color}
      />
      <path
        d="M13.0333 12.0592V6.72624C13.0333 6.38106 13.3132 6.10124 13.6583 6.10124C14.0035 6.10124 14.2833 6.38106 14.2833 6.72624V12.0592C14.2833 12.4044 14.0035 12.6842 13.6583 12.6842C13.3132 12.6842 13.0333 12.4044 13.0333 12.0592Z"
        fill={color}
      />
      <path
        d="M7.65802 7.43457C8.0032 7.43457 8.28302 7.71439 8.28302 8.05957C8.28302 8.40475 8.0032 8.68457 7.65802 8.68457H2.32501C1.97983 8.68457 1.70001 8.40475 1.70001 8.05957C1.70001 7.71439 1.97983 7.43457 2.32501 7.43457H7.65802Z"
        fill={color}
      />
      <path
        d="M1.70001 12.0596V4.05957C1.70001 3.71439 1.97983 3.43457 2.32501 3.43457C2.67019 3.43457 2.95001 3.71439 2.95001 4.05957V12.0596C2.95001 12.4047 2.67019 12.6846 2.32501 12.6846C1.97983 12.6846 1.70001 12.4047 1.70001 12.0596Z"
        fill={color}
      />
    </IconWrapper>
  );
}
