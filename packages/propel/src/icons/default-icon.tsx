import * as React from "react";

import { IconWrapper } from "./icon-wrapper";
import type { ISvgIcons } from "./type";

export function DefaultIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <rect x="4" y="4" width="8" height="8" rx="1" fill={color} />
    </IconWrapper>
  );
}
