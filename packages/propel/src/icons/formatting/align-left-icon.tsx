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

export function AlignLeftIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M11.0004 11.375C11.3454 11.3752 11.6254 11.6549 11.6254 12C11.6254 12.3451 11.3454 12.6248 11.0004 12.625H2.33337C1.9882 12.625 1.70837 12.3452 1.70837 12C1.70837 11.6548 1.9882 11.375 2.33337 11.375H11.0004ZM13.6664 8.70801C14.0115 8.70801 14.2912 8.98798 14.2914 9.33301C14.2914 9.67819 14.0116 9.95801 13.6664 9.95801H2.33337C1.9882 9.95801 1.70837 9.67819 1.70837 9.33301C1.70855 8.98798 1.9883 8.70801 2.33337 8.70801H13.6664ZM11.0004 6.04199C11.3454 6.04217 11.6254 6.32192 11.6254 6.66699C11.6252 7.01191 11.3453 7.29182 11.0004 7.29199H2.33337C1.9883 7.29199 1.70855 7.01202 1.70837 6.66699C1.70837 6.32181 1.9882 6.04199 2.33337 6.04199H11.0004ZM13.6664 3.375C14.0116 3.375 14.2914 3.65482 14.2914 4C14.2914 4.34518 14.0116 4.625 13.6664 4.625H2.33337C1.9882 4.625 1.70837 4.34518 1.70837 4C1.70837 3.65482 1.9882 3.375 2.33337 3.375H13.6664Z"
        fill={color}
      />
    </IconWrapper>
  );
}
