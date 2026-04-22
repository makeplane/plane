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

export const UnlockKeyHoleIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => (
  <IconWrapper color={color} {...rest}>
    <path
      d="M4.66675 6.66667V5.33333C4.66675 3.49238 6.15913 2 8.00008 2C9.36696 2 10.5417 2.82273 11.0561 4M8.00008 9.66667V11M5.86675 14H10.1334C11.2535 14 11.8136 14 12.2414 13.782C12.6177 13.5903 12.9237 13.2843 13.1154 12.908C13.3334 12.4802 13.3334 11.9201 13.3334 10.8V9.86667C13.3334 8.74656 13.3334 8.18651 13.1154 7.75869C12.9237 7.38236 12.6177 7.0764 12.2414 6.88465C11.8136 6.66667 11.2535 6.66667 10.1334 6.66667H5.86675C4.74664 6.66667 4.18659 6.66667 3.75877 6.88465C3.38244 7.0764 3.07648 7.38236 2.88474 7.75869C2.66675 8.18651 2.66675 8.74656 2.66675 9.86667V10.8C2.66675 11.9201 2.66675 12.4802 2.88474 12.908C3.07648 13.2843 3.38244 13.5903 3.75877 13.782C4.18659 14 4.74664 14 5.86675 14Z"
      stroke={color}
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconWrapper>
);
