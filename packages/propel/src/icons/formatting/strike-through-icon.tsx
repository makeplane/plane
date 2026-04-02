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

export function StrikeThroughIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M3.37512 10.6672C3.37512 10.322 3.65494 10.0422 4.00012 10.0422C4.3453 10.0422 4.62512 10.322 4.62512 10.6672C4.62512 11.7947 5.53954 12.7092 6.66711 12.7092H9.33313C10.4607 12.7092 11.3751 11.7947 11.3751 10.6672C11.3751 9.53962 10.4607 8.62518 9.33313 8.62518H2.00012C1.65494 8.62518 1.37512 8.34536 1.37512 8.00018C1.3753 7.65515 1.65505 7.37518 2.00012 7.37518H14.0001C14.3452 7.37518 14.6249 7.65515 14.6251 8.00018C14.6251 8.34536 14.3453 8.62518 14.0001 8.62518H11.9142C12.3589 9.18643 12.6251 9.89552 12.6251 10.6672C12.6251 12.4851 11.151 13.9592 9.33313 13.9592H6.66711C4.84917 13.9592 3.37512 12.4851 3.37512 10.6672ZM11.3751 5.33417C11.3751 4.20659 10.4607 3.29218 9.33313 3.29218H6.66711C5.53953 3.29218 4.62512 4.20659 4.62512 5.33417C4.62495 5.6792 4.34519 5.95917 4.00012 5.95917C3.65505 5.95917 3.3753 5.6792 3.37512 5.33417C3.37512 3.51623 4.84918 2.04218 6.66711 2.04218H9.33313C11.151 2.04218 12.6251 3.51623 12.6251 5.33417C12.6249 5.6792 12.3452 5.95917 12.0001 5.95917C11.6551 5.95917 11.3753 5.6792 11.3751 5.33417Z"
        fill={color}
      />
    </IconWrapper>
  );
}
