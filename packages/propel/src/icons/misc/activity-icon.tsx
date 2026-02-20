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

export const ActivityIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M6 1.375C6.26889 1.37514 6.50774 1.54762 6.59277 1.80273L10 12.0244L11.4072 7.80273L11.4453 7.71094C11.5516 7.50685 11.7645 7.375 12 7.375H14.666C15.0112 7.375 15.291 7.65482 15.291 8C15.291 8.34518 15.0112 8.625 14.666 8.625H12.4502L10.5928 14.1973C10.5077 14.4524 10.2689 14.6249 10 14.625C9.73098 14.625 9.4923 14.4525 9.40723 14.1973L6 3.97559L4.59277 8.19727C4.50774 8.45238 4.26889 8.62486 4 8.625H1.33301C0.98783 8.625 0.708008 8.34518 0.708008 8C0.708008 7.65482 0.98783 7.375 1.33301 7.375H3.5498L5.40723 1.80273L5.44531 1.71094C5.55165 1.50685 5.76449 1.375 6 1.375Z"
        fill={color}
      />
    </IconWrapper>
  );
};
