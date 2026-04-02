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

export function BulletedListFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.33325 8.00033C5.33325 7.63214 5.63173 7.33366 5.99992 7.33366L13.9999 7.33366C14.3681 7.33366 14.6666 7.63214 14.6666 8.00033C14.6666 8.36852 14.3681 8.66699 13.9999 8.66699L5.99992 8.66699C5.63173 8.66699 5.33325 8.36852 5.33325 8.00033Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.33325 4.00033C5.33325 3.63214 5.63173 3.33366 5.99992 3.33366L13.9999 3.33366C14.3681 3.33366 14.6666 3.63214 14.6666 4.00033C14.6666 4.36852 14.3681 4.66699 13.9999 4.66699L5.99992 4.66699C5.63173 4.66699 5.33325 4.36852 5.33325 4.00033Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.33325 12.0003C5.33325 11.6321 5.63173 11.3337 5.99992 11.3337L13.9999 11.3337C14.3681 11.3337 14.6666 11.6321 14.6666 12.0003C14.6666 12.3685 14.3681 12.667 13.9999 12.667L5.99992 12.667C5.63173 12.667 5.33325 12.3685 5.33325 12.0003Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.33325 8.00033C1.33325 7.26395 1.93021 6.66699 2.66659 6.66699C3.40296 6.66699 3.99992 7.26395 3.99992 8.00033C3.99992 8.73671 3.40296 9.33366 2.66659 9.33366C1.93021 9.33366 1.33325 8.73671 1.33325 8.00033Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.33325 4.00033C1.33325 3.26395 1.93021 2.66699 2.66659 2.66699C3.40296 2.66699 3.99992 3.26395 3.99992 4.00033C3.99992 4.73671 3.40296 5.33366 2.66659 5.33366C1.93021 5.33366 1.33325 4.73671 1.33325 4.00033Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.33325 12.0003C1.33325 11.2639 1.93021 10.667 2.66659 10.667C3.40296 10.667 3.99992 11.2639 3.99992 12.0003C3.99992 12.7367 3.40296 13.3337 2.66659 13.3337C1.93021 13.3337 1.33325 12.7367 1.33325 12.0003Z"
        fill={color}
      />
    </IconWrapper>
  );
}
