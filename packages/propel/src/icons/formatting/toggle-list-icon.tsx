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

export function ToggleListIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M13.9997 2.70831C14.3449 2.70831 14.6247 2.98813 14.6247 3.33331C14.6247 3.67848 14.3449 3.95831 13.9997 3.95831H6.66667C6.32149 3.95831 6.04167 3.67848 6.04167 3.33331C6.04167 2.98813 6.32149 2.70831 6.66667 2.70831H13.9997Z"
        fill={color}
      />
      <path
        d="M13.9997 7.37497C14.3449 7.37497 14.6247 7.6548 14.6247 7.99997C14.6247 8.34515 14.3449 8.62497 13.9997 8.62497H6.66667C6.32149 8.62497 6.04167 8.34515 6.04167 7.99997C6.04167 7.6548 6.32149 7.37497 6.66667 7.37497H13.9997Z"
        fill={color}
      />
      <path
        d="M13.9997 12.0416C14.3449 12.0416 14.6247 12.3215 14.6247 12.6666C14.6247 13.0118 14.3449 13.2916 13.9997 13.2916H6.66667C6.32149 13.2916 6.04167 13.0118 6.04167 12.6666C6.04167 12.3215 6.32149 12.0416 6.66667 12.0416H13.9997Z"
        fill={color}
      />
      <path
        d="M1.55762 2.22426C1.80169 1.98018 2.1983 1.98018 2.44238 2.22426L4.44238 4.22426C4.68646 4.46833 4.68646 4.86494 4.44238 5.10902L2.44238 7.10902C2.1983 7.3531 1.80169 7.3531 1.55762 7.10902C1.31354 6.86494 1.31354 6.46833 1.55762 6.22426L3.11523 4.66664L1.55762 3.10902C1.31354 2.86494 1.31354 2.46833 1.55762 2.22426Z"
        fill={color}
      />
      <path
        d="M1.55762 8.89092C1.80169 8.64685 2.1983 8.64685 2.44238 8.89092L4.44238 10.8909C4.68646 11.135 4.68646 11.5316 4.44238 11.7757L2.44238 13.7757C2.1983 14.0198 1.80169 14.0198 1.55762 13.7757C1.31354 13.5316 1.31354 13.135 1.55762 12.8909L3.11523 11.3333L1.55762 9.77569C1.31354 9.53161 1.31354 9.135 1.55762 8.89092Z"
        fill={color}
      />
    </IconWrapper>
  );
}
