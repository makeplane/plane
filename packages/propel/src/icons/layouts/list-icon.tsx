import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function ListLayoutIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M14 11.375C14.3452 11.375 14.625 11.6548 14.625 12C14.625 12.3452 14.3452 12.625 14 12.625H2C1.65482 12.625 1.375 12.3452 1.375 12C1.375 11.6548 1.65482 11.375 2 11.375H14ZM14 7.375C14.3452 7.375 14.625 7.65482 14.625 8C14.625 8.34518 14.3452 8.625 14 8.625H2C1.65482 8.625 1.375 8.34518 1.375 8C1.375 7.65482 1.65482 7.375 2 7.375H14ZM14 3.375C14.3452 3.375 14.625 3.65482 14.625 4C14.625 4.34518 14.3452 4.625 14 4.625H2C1.65482 4.625 1.375 4.34518 1.375 4C1.375 3.65482 1.65482 3.375 2 3.375H14Z"
        fill={color}
      />
    </IconWrapper>
  );
}
