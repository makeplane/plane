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

export function H5Icon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M7.65802 7.375C8.0032 7.375 8.28302 7.65482 8.28302 8C8.28302 8.34518 8.0032 8.625 7.65802 8.625H2.32501C1.97983 8.625 1.70001 8.34518 1.70001 8C1.70001 7.65482 1.97983 7.375 2.32501 7.375H7.65802Z"
        fill={color}
      />
      <path
        d="M1.70001 12V4C1.70001 3.65482 1.97983 3.375 2.32501 3.375C2.67019 3.375 2.95001 3.65482 2.95001 4V12C2.95001 12.3452 2.67019 12.625 2.32501 12.625C1.97983 12.625 1.70001 12.3452 1.70001 12Z"
        fill={color}
      />
      <path
        d="M7.03335 12V4C7.03335 3.65482 7.31317 3.375 7.65835 3.375C8.00352 3.375 8.28335 3.65482 8.28335 4V12C8.28335 12.3452 8.00352 12.625 7.65835 12.625C7.31317 12.625 7.03335 12.3452 7.03335 12Z"
        fill={color}
      />
      <path
        d="M10.3667 8.66667V6.66667C10.3667 6.32149 10.6465 6.04167 10.9917 6.04167H13.6587C14.0037 6.04184 14.2837 6.3216 14.2837 6.66667C14.2837 7.01174 14.0037 7.29149 13.6587 7.29167H11.6167V8.66667C11.6167 9.01184 11.3369 9.29167 10.9917 9.29167C10.6465 9.29167 10.3667 9.01184 10.3667 8.66667Z"
        fill={color}
      />
      <path
        d="M13.0337 10.3337C13.0337 9.79167 12.5608 9.29167 11.8579 9.29167L10.9917 9.29167C10.6465 9.29167 10.3667 9.01184 10.3667 8.66667C10.3667 8.32149 10.6465 8.04167 10.9917 8.04167H11.8579C13.155 8.04167 14.2837 9.00899 14.2837 10.3337C14.2835 11.6582 13.1549 12.6247 11.8579 12.6247C11.4284 12.6246 11.0662 12.5359 10.7124 12.359C10.4036 12.2047 10.2787 11.8289 10.4331 11.5202C10.5875 11.2118 10.9624 11.0867 11.271 11.2409C11.4502 11.3305 11.6212 11.3746 11.8579 11.3747C12.5606 11.3747 13.0335 10.8755 13.0337 10.3337Z"
        fill={color}
      />
    </IconWrapper>
  );
}
