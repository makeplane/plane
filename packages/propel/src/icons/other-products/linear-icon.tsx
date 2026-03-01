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

export function LinearIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M2.6835 3.43834C3.34027 2.6727 4.15501 2.05833 5.07173 1.63742C5.98845 1.21652 6.98543 0.999067 7.99417 1C11.864 1 15 4.136 15 8.00525C15 10.1286 14.055 12.032 12.5617 13.3165L2.68408 3.43834H2.6835ZM2.05992 4.28184L11.7176 13.9395C11.4115 14.1324 11.0907 14.3008 10.7551 14.4447L1.55475 5.24492C1.69903 4.90931 1.86742 4.58789 2.05992 4.28184ZM1.18783 6.34508L9.65492 14.8122C9.24036 14.9133 8.81356 14.9759 8.3745 15L1 7.6255C1.02294 7.19381 1.08582 6.76517 1.18783 6.34508ZM1.08867 9.18125L6.81875 14.9119C5.38784 14.6674 4.06807 13.9849 3.0416 12.9584C2.01513 11.9319 1.33256 10.6122 1.08808 9.18125H1.08867Z"
        fill="#5E6AD2"
      />
    </IconWrapper>
  );
}
