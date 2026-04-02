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

export function CodeFilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8619 4.19526C11.1223 3.93491 11.5444 3.93491 11.8047 4.19526L15.1381 7.5286C15.3984 7.78895 15.3984 8.21106 15.1381 8.47141L11.8047 11.8047C11.5444 12.0651 11.1223 12.0651 10.8619 11.8047C10.6016 11.5444 10.6016 11.1223 10.8619 10.8619L13.7239 8L10.8619 5.13807C10.6016 4.87772 10.6016 4.45561 10.8619 4.19526Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.13807 4.19526C5.39842 4.45561 5.39842 4.87772 5.13807 5.13807L2.27614 8L5.13807 10.8619C5.39842 11.1223 5.39842 11.5444 5.13807 11.8047C4.87772 12.0651 4.45561 12.0651 4.19526 11.8047L0.861926 8.47141C0.601577 8.21106 0.601577 7.78895 0.861926 7.5286L4.19526 4.19526C4.45561 3.93491 4.87772 3.93491 5.13807 4.19526Z"
        fill={color}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.47795 1.34921C9.83737 1.42908 10.064 1.7852 9.98412 2.14462L7.31746 14.1446C7.23758 14.504 6.88147 14.7307 6.52204 14.6508C6.16262 14.5709 5.936 14.2148 6.01587 13.8554L8.68254 1.85538C8.76241 1.49596 9.11853 1.26934 9.47795 1.34921Z"
        fill={color}
      />
    </IconWrapper>
  );
}
