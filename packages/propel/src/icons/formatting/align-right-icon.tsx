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

export function AlignRightIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M13.6664 11.375C14.0116 11.375 14.2914 11.6548 14.2914 12C14.2914 12.3452 14.0116 12.625 13.6664 12.625H5.00037C4.65519 12.625 4.37537 12.3452 4.37537 12C4.37537 11.6548 4.65519 11.375 5.00037 11.375H13.6664ZM13.6664 8.70801C14.0115 8.70801 14.2912 8.98798 14.2914 9.33301C14.2914 9.67819 14.0116 9.95801 13.6664 9.95801H2.33337C1.9882 9.95801 1.70837 9.67819 1.70837 9.33301C1.70855 8.98798 1.9883 8.70801 2.33337 8.70801H13.6664ZM13.6664 6.04199C14.0116 6.04199 14.2914 6.32181 14.2914 6.66699C14.2912 7.01202 14.0115 7.29199 13.6664 7.29199H5.00037C4.6553 7.29199 4.37554 7.01202 4.37537 6.66699C4.37537 6.32181 4.65519 6.04199 5.00037 6.04199H13.6664ZM13.6664 3.375C14.0116 3.375 14.2914 3.65482 14.2914 4C14.2914 4.34518 14.0116 4.625 13.6664 4.625H2.33337C1.9882 4.625 1.70837 4.34518 1.70837 4C1.70837 3.65482 1.9882 3.375 2.33337 3.375H13.6664Z"
        fill={color}
      />
    </IconWrapper>
  );
}
