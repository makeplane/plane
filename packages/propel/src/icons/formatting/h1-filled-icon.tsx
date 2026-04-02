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

export function H1FilledIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M7.99986 7.375C8.34504 7.375 8.62486 7.65482 8.62486 8C8.62486 8.34518 8.34504 8.625 7.99986 8.625H2.66685C2.32168 8.625 2.04185 8.34518 2.04185 8C2.04185 7.65482 2.32168 7.375 2.66685 7.375H7.99986Z"
        fill={color}
      />
      <path
        d="M2.04185 12V4C2.04185 3.65482 2.32168 3.375 2.66685 3.375C3.01203 3.375 3.29185 3.65482 3.29185 4V12C3.29185 12.3452 3.01203 12.625 2.66685 12.625C2.32168 12.625 2.04185 12.3452 2.04185 12Z"
        fill={color}
      />
      <path
        d="M7.37519 12V4C7.37519 3.65482 7.65501 3.375 8.00019 3.375C8.34537 3.375 8.62519 3.65482 8.62519 4V12C8.62519 12.3452 8.34537 12.625 8.00019 12.625C7.65501 12.625 7.37519 12.3452 7.37519 12Z"
        fill={color}
      />
      <path
        d="M12.7085 11.9997V7.83464L11.6802 8.52018C11.393 8.71159 11.0045 8.63353 10.813 8.34635C10.6219 8.05922 10.6998 7.67153 10.9868 7.48014L12.9868 6.14616C13.1786 6.01844 13.4253 6.00717 13.6284 6.11589C13.8316 6.22467 13.9585 6.43621 13.9585 6.66667V11.9997C13.9585 12.3449 13.6787 12.6247 13.3335 12.6247C12.9883 12.6247 12.7085 12.3449 12.7085 11.9997Z"
        fill={color}
      />
    </IconWrapper>
  );
}
