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

export function H6Icon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M7.03302 12V8.625H2.95001V12C2.95001 12.3452 2.67019 12.625 2.32501 12.625C1.97983 12.625 1.70001 12.3452 1.70001 12V4C1.70001 3.65482 1.97983 3.375 2.32501 3.375C2.67019 3.375 2.95001 3.65482 2.95001 4V7.375H7.03302V4C7.03302 3.65493 7.31299 3.37518 7.65802 3.375C8.0032 3.375 8.28302 3.65482 8.28302 4V12C8.28302 12.3452 8.0032 12.625 7.65802 12.625C7.31299 12.6248 7.03302 12.3451 7.03302 12ZM13.033 10.667C13.033 10.2758 12.7162 9.95801 12.325 9.95801C11.9828 9.95801 11.6969 10.2009 11.6307 10.5234L11.617 10.667L11.6307 10.8096C11.6968 11.1323 11.9827 11.375 12.325 11.375C12.7161 11.375 13.0328 11.058 13.033 10.667ZM14.283 10.667C14.2828 11.7484 13.4065 12.625 12.325 12.625C11.2436 12.625 10.3672 11.7484 10.367 10.667C10.367 9.74034 10.5545 8.97043 10.9402 8.24707C11.3178 7.53929 11.8705 6.90369 12.5496 6.22461C12.7936 5.98059 13.1893 5.98069 13.4334 6.22461C13.6775 6.46869 13.6775 6.86432 13.4334 7.1084C12.8258 7.71598 12.3979 8.21805 12.1082 8.7207C12.1794 8.71286 12.2517 8.70801 12.325 8.70801C13.4066 8.70801 14.283 9.58543 14.283 10.667Z"
        fill={color}
      />
    </IconWrapper>
  );
}
