/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export const CheckCircleFilledIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  const clipPathId = React.useId();

  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99984 0.666992C3.94975 0.666992 0.666504 3.95024 0.666504 8.00033C0.666504 12.0504 3.94975 15.3337 7.99984 15.3337C12.0499 15.3337 15.3332 12.0504 15.3332 8.00033C15.3332 3.95024 12.0499 0.666992 7.99984 0.666992ZM11.4712 6.47173C11.7316 6.21138 11.7316 5.78927 11.4712 5.52892C11.2109 5.26857 10.7888 5.26857 10.5284 5.52892L6.99984 9.05752L5.47124 7.52892C5.21089 7.26857 4.78878 7.26857 4.52843 7.52892C4.26808 7.78927 4.26808 8.21138 4.52843 8.47173L6.52843 10.4717C6.78878 10.7321 7.21089 10.7321 7.47124 10.4717L11.4712 6.47173Z"
        fill={color}
      />
    </IconWrapper>
  );
};
