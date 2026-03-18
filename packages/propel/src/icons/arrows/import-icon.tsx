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

export function ImportIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M14 13.375C14.3452 13.375 14.625 13.6548 14.625 14C14.625 14.3452 14.3452 14.625 14 14.625H2C1.65482 14.625 1.375 14.3452 1.375 14C1.375 13.6548 1.65482 13.375 2 13.375H14ZM7.375 2C7.375 1.65482 7.65482 1.375 8 1.375C8.34518 1.375 8.625 1.65482 8.625 2V9.82422L11.5576 6.8916C11.8017 6.64752 12.1983 6.64752 12.4424 6.8916C12.6861 7.13565 12.6862 7.53141 12.4424 7.77539L8.44238 11.7754C8.32517 11.8926 8.16576 11.958 8 11.958C7.83424 11.958 7.67483 11.8926 7.55762 11.7754L3.55762 7.77539C3.31381 7.53141 3.31392 7.13565 3.55762 6.8916C3.80169 6.64752 4.19831 6.64752 4.44238 6.8916L7.375 9.82422V2Z"
        fill={color}
      />
    </IconWrapper>
  );
}
