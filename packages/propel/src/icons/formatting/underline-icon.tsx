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

export function UnderlineIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M13.334 13.042C13.6789 13.0422 13.9588 13.3221 13.959 13.667C13.959 14.0121 13.679 14.2918 13.334 14.292H2.66699C2.32181 14.292 2.04199 14.0122 2.04199 13.667C2.04217 13.322 2.32192 13.042 2.66699 13.042H13.334ZM3.375 7.00098V2.33398C3.375 1.98891 3.65497 1.70916 4 1.70898C4.34518 1.70898 4.625 1.98881 4.625 2.33398V7.00098C4.62518 8.86467 6.1363 10.3758 8 10.376C9.86385 10.376 11.3748 8.86478 11.375 7.00098V2.33398C11.375 1.98892 11.655 1.70916 12 1.70898C12.3452 1.70898 12.625 1.98881 12.625 2.33398V7.00098C12.6248 9.55514 10.5542 11.626 8 11.626C5.44594 11.6258 3.37518 9.55503 3.375 7.00098Z"
        fill={color}
      />
    </IconWrapper>
  );
}
