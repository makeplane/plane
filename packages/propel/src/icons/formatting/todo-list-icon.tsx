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

export function TodoListIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <g transform="translate(1.3744, 2.0416)">
        <path
          d="M12.6249 0.666667C12.9701 0.666667 13.2499 0.946489 13.2499 1.29167C13.2499 1.63684 12.9701 1.91667 12.6249 1.91667H7.29186C6.94669 1.91667 6.66686 1.63684 6.66686 1.29167C6.66686 0.946489 6.94669 0.666667 7.29186 0.666667H12.6249Z"
          fill={color}
        />
        <path
          d="M12.6249 5.33333C12.9701 5.33333 13.2499 5.61316 13.2499 5.95833C13.2499 6.30351 12.9701 6.58333 12.6249 6.58333H7.29186C6.94669 6.58333 6.66686 6.30351 6.66686 5.95833C6.66686 5.61316 6.94669 5.33333 7.29186 5.33333H12.6249Z"
          fill={color}
        />
        <path
          d="M12.6249 10C12.9701 10 13.2499 10.2798 13.2499 10.625C13.2499 10.9702 12.9701 11.25 12.6249 11.25H7.29186C6.94669 11.25 6.66686 10.9702 6.66686 10.625C6.66686 10.2798 6.94669 10 7.29186 10H12.6249Z"
          fill={color}
        />
        <path
          d="M4.18281 7.51595C4.42689 7.27187 4.8235 7.27187 5.06758 7.51595C5.31166 7.76003 5.31166 8.15664 5.06758 8.40072L2.40059 11.0667C2.15651 11.3108 1.76088 11.3108 1.5168 11.0667L0.182814 9.73372C-0.0609923 9.48974 -0.0608839 9.09399 0.182814 8.84994C0.426892 8.60586 0.823502 8.60586 1.06758 8.84994L1.9582 9.74056L4.18281 7.51595Z"
          fill={color}
        />
        <path
          d="M4.0002 1.29199C4.0002 1.26898 3.98122 1.25 3.9582 1.25H1.29219C1.26918 1.25 1.2502 1.26898 1.2502 1.29199V3.95801C1.2502 3.98102 1.26918 4 1.29219 4H3.9582C3.98122 4 4.0002 3.98102 4.0002 3.95801V1.29199ZM5.2502 3.95801C5.2502 4.67138 4.67157 5.25 3.9582 5.25H1.29219C0.578821 5.25 0.000197039 4.67138 0.000197039 3.95801V1.29199C0.000197039 0.578624 0.578821 0 1.29219 0H3.9582C4.67157 0 5.2502 0.578624 5.2502 1.29199V3.95801Z"
          fill={color}
        />
      </g>
    </IconWrapper>
  );
}
