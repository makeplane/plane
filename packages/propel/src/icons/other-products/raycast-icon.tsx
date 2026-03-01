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

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function RaycastIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.50233 10.037V11.4977L1 7.99533L1.73383 7.26675L4.50233 10.037ZM5.963 11.4977H4.50233L8.00467 15L8.73558 14.2691L5.963 11.4977ZM14.2697 8.72858L15 7.99825L8.00175 1L7.27083 1.72975L10.0364 4.5H8.36517L6.43492 2.57033L5.70458 3.30067L6.90625 4.50233H6.06975V9.93317H11.5V9.09783L12.7017 10.2995L13.432 9.56917L11.5 7.6325V5.96183L14.2697 8.72858ZM4.8675 4.13367L4.13833 4.86458L4.92117 5.648L5.65092 4.91708L4.8675 4.13367ZM11.0829 10.3491L10.3555 11.0788L11.1383 11.8622L11.8692 11.1325L11.0829 10.3491ZM3.30067 5.70108L2.57033 6.43083L4.50233 8.364V6.90217L3.30067 5.70108ZM9.09667 11.4977H7.636L9.56917 13.4297L10.2983 12.6993L9.09667 11.4977Z"
        fill="#F75F5F"
      />
    </IconWrapper>
  );
}
