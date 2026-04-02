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

export function BoldIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M11.667 10.6672C11.667 9.53962 10.7526 8.62518 9.625 8.62518H4.25V12.7092H9.625C10.7526 12.7092 11.667 11.7947 11.667 10.6672ZM11 5.33417C11 4.20659 10.0856 3.29218 8.95801 3.29218H4.25V7.37518H8.95801C10.0855 7.37518 10.9998 6.46157 11 5.33417ZM12.25 5.33417C12.2499 6.29658 11.8363 7.16202 11.1777 7.76385C12.2128 8.31857 12.917 9.41074 12.917 10.6672C12.917 12.4851 11.4429 13.9592 9.625 13.9592H3.625C3.27993 13.9592 3.00018 13.6792 3 13.3342V2.66718C3 2.322 3.27982 2.04218 3.625 2.04218H8.95801C10.7759 2.04218 12.25 3.51623 12.25 5.33417Z"
        fill={color}
      />
    </IconWrapper>
  );
}
