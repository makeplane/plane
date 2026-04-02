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

export function ItalicFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M10.0207 2.00033H12.6665C13.0347 2.00033 13.3332 2.2988 13.3332 2.66699C13.3332 3.03518 13.0347 3.33366 12.6665 3.33366H10.4618L6.9618 12.667H9.33317C9.70136 12.667 9.99984 12.9655 9.99984 13.3337C9.99984 13.7018 9.70136 14.0003 9.33317 14.0003H6.00662C6.00205 14.0004 5.99747 14.0004 5.99289 14.0003H3.33317C2.96498 14.0003 2.6665 13.7018 2.6665 13.3337C2.6665 12.9655 2.96498 12.667 3.33317 12.667H5.5378L9.0378 3.33366H6.6665C6.29831 3.33366 5.99984 3.03518 5.99984 2.66699C5.99984 2.2988 6.29831 2.00033 6.6665 2.00033H9.9792C9.99299 1.99989 10.0068 1.99989 10.0207 2.00033Z"
        fill={color}
      />
    </IconWrapper>
  );
}
