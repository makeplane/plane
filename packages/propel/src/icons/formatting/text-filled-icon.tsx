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

export function TextFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.33326 4C4.47524 4 4.61508 4.03171 4.74244 4.0918L4.86549 4.16113L4.97682 4.24805C5.08098 4.34237 5.16351 4.45908 5.21803 4.58984L7.91041 11.0498C8.04303 11.3684 7.89205 11.7344 7.5735 11.8672C7.25493 11.9998 6.88886 11.8488 6.75611 11.5303L4.33326 5.71582L1.91041 11.5303C1.77765 11.8488 1.41157 11.9998 1.09303 11.8672C0.774507 11.7344 0.623502 11.3684 0.756114 11.0498L3.44947 4.58984L3.51295 4.46387C3.58556 4.34337 3.68401 4.23982 3.80201 4.16113C3.95933 4.05628 4.14421 4.00007 4.33326 4Z"
        fill={color}
      />
      <path
        d="M14.0416 11.2904V6.6234C14.0416 6.27822 14.3214 5.9984 14.6666 5.9984C15.0118 5.9984 15.2916 6.27822 15.2916 6.6234V11.2904C15.2914 11.6354 15.0117 11.9154 14.6666 11.9154C14.3215 11.9154 14.0418 11.6354 14.0416 11.2904Z"
        fill={color}
      />
      <path
        d="M6.46431 8.66507C6.80932 8.66528 7.08931 8.94502 7.08931 9.29007C7.08931 9.63512 6.80932 9.91486 6.46431 9.91507H2.2026C1.85742 9.91507 1.5776 9.63525 1.5776 9.29007C1.5776 8.94489 1.85742 8.66507 2.2026 8.66507H6.46431Z"
        fill={color}
      />
      <path
        d="M14.0419 8.95641C14.0417 8.01307 13.2763 7.2484 12.3329 7.2484C11.3897 7.24858 10.6251 8.01318 10.6249 8.95641C10.6249 9.89979 11.3896 10.6652 12.3329 10.6654C13.2764 10.6654 14.0419 9.89989 14.0419 8.95641ZM15.2919 8.95641C15.2919 10.5903 13.9668 11.9154 12.3329 11.9154C10.6992 11.9152 9.37493 10.5901 9.37493 8.95641C9.3751 7.32282 10.6994 5.99858 12.3329 5.9984C13.9667 5.9984 15.2917 7.32272 15.2919 8.95641Z"
        fill={color}
      />
    </IconWrapper>
  );
}
