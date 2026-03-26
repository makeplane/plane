/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export const CloseCircleFilledIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => {
  const clipPathId = React.useId();

  return (
    <IconWrapper color={color} clipPathId={clipPathId} {...rest}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.99984 0.666992C3.94975 0.666992 0.666504 3.95024 0.666504 8.00033C0.666504 12.0504 3.94975 15.3337 7.99984 15.3337C12.0499 15.3337 15.3332 12.0504 15.3332 8.00033C15.3332 3.95024 12.0499 0.666992 7.99984 0.666992ZM10.4712 5.52892C10.7316 5.78927 10.7316 6.21138 10.4712 6.47173L8.94265 8.00033L10.4712 9.52892C10.7316 9.78927 10.7316 10.2114 10.4712 10.4717C10.2109 10.7321 9.78878 10.7321 9.52843 10.4717L7.99984 8.94313L6.47124 10.4717C6.21089 10.7321 5.78878 10.7321 5.52843 10.4717C5.26808 10.2114 5.26808 9.78927 5.52843 9.52892L7.05703 8.00033L5.52843 6.47173C5.26808 6.21138 5.26808 5.78927 5.52843 5.52892C5.78878 5.26857 6.21089 5.26857 6.47124 5.52892L7.99984 7.05752L9.52843 5.52892C9.78878 5.26857 10.2109 5.26857 10.4712 5.52892Z"
        fill={color}
      />
    </IconWrapper>
  );
};
