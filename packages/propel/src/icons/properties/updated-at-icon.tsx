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

import React from "react";
import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function UpdatedAtPropertyIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  const clipPathId = React.useId();

  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        d="M7.99992 3.99967V7.99967L10.4922 9.2458M14.4466 6.29498C13.6934 3.43892 11.0926 1.33301 7.99992 1.33301C4.31802 1.33301 1.33325 4.31778 1.33325 7.99967C1.33325 11.3417 3.79245 14.1094 7 14.5919"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.77297 12.9903C9.82241 12.8617 9.84713 12.7975 9.87941 12.7373C9.90808 12.6839 9.94117 12.633 9.97834 12.5851C10.0202 12.5312 10.0689 12.4825 10.1663 12.3851L14.2513 8.30002C14.6514 7.89999 15.2999 7.89999 15.7 8.30002C16.1 8.70006 16.1 9.34864 15.7 9.74867L11.6149 13.8337C11.5175 13.9311 11.4688 13.9798 11.4149 14.0217C11.367 14.0588 11.3161 14.0919 11.2627 14.1206C11.2025 14.1529 11.1383 14.1776 11.0097 14.227L9 15L9.77297 12.9903Z"
        fill={color}
      />
      <path
        d="M9.74537 13.0621C9.79871 12.9234 9.82538 12.854 9.87112 12.8223C9.91109 12.7945 9.96056 12.784 10.0084 12.7932C10.0631 12.8036 10.1156 12.8561 10.2207 12.9612L11.0388 13.7794C11.1439 13.8844 11.1964 13.9369 11.2068 13.9916C11.216 14.0394 11.2055 14.0889 11.1777 14.1289C11.146 14.1746 11.0766 14.2013 10.9379 14.2546L9 15L9.74537 13.0621Z"
        fill={color}
      />
    </IconWrapper>
  );
}
