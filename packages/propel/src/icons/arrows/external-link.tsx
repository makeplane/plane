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

export function ExternalLinkIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M11.9589 11.334C11.9588 11.6789 11.6789 11.9588 11.3339 11.959C10.9889 11.959 10.7091 11.679 10.7089 11.334V6.17578L5.10933 11.7754C4.86525 12.0195 4.46864 12.0195 4.22456 11.7754C3.98086 11.5313 3.98076 11.1356 4.22456 10.8916L9.82417 5.29199H4.66695C4.32177 5.29199 4.04195 5.01217 4.04195 4.66699C4.04195 4.32181 4.32177 4.04199 4.66695 4.04199H11.3339C11.679 4.04217 11.9589 4.32192 11.9589 4.66699V11.334Z"
        fill={color}
      />
    </IconWrapper>
  );
}
