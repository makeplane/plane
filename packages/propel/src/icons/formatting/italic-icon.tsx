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

export function ItalicIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M12.666 2.04199C13.0112 2.04199 13.291 2.32181 13.291 2.66699C13.291 3.01217 13.0112 3.29199 12.666 3.29199H10.4326L6.90137 12.709H9.33301C9.67819 12.709 9.95801 12.9888 9.95801 13.334C9.95783 13.679 9.67808 13.959 9.33301 13.959H3.33301C2.98794 13.959 2.70818 13.679 2.70801 13.334C2.70801 12.9888 2.98783 12.709 3.33301 12.709H5.56641L9.09766 3.29199H6.66602C6.32099 3.29182 6.04102 3.01206 6.04102 2.66699C6.04102 2.32192 6.32099 2.04217 6.66602 2.04199H12.666Z"
        fill={color}
      />
    </IconWrapper>
  );
}
