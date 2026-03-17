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

export const ShiftIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M4.84217 6.04199H6.00037C6.3454 6.04217 6.62537 6.32192 6.62537 6.66699V13.375H9.37537V6.66699C9.37537 6.32181 9.6552 6.04199 10.0004 6.04199H11.1586L7.9994 2.88379L4.84217 6.04199ZM10.6185 13.7363C10.6108 13.8305 10.5913 13.9632 10.5209 14.1016C10.429 14.2818 10.2822 14.4286 10.1019 14.5205C9.96358 14.591 9.83092 14.6105 9.7367 14.6182C9.64992 14.6253 9.55011 14.625 9.46717 14.625H6.53358C6.45055 14.625 6.35001 14.6253 6.26307 14.6182C6.16886 14.6104 6.03603 14.5909 5.89783 14.5205C5.71769 14.4286 5.57168 14.2818 5.47987 14.1016C5.40932 13.9631 5.38893 13.8306 5.38123 13.7363C5.37415 13.6495 5.37537 13.5497 5.37537 13.4668V7.29199H3.33338C3.08075 7.29199 2.85308 7.13955 2.75623 6.90625C2.65952 6.67277 2.71238 6.40336 2.891 6.22461L7.55799 1.55762L7.65369 1.48047C7.75561 1.41253 7.87608 1.375 8.00037 1.375C8.16586 1.37509 8.32468 1.44069 8.44178 1.55762L13.1088 6.22461C13.2875 6.40336 13.3413 6.6727 13.2445 6.90625C13.1477 7.13968 12.9191 7.29199 12.6664 7.29199H10.6254V13.4668C10.6254 13.5497 10.6256 13.6495 10.6185 13.7363Z"
        fill={color}
      />
    </IconWrapper>
  );
};
