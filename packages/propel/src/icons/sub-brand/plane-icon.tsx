import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function PlaneNewIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} {...rest}>
      <path
        d="M10.3617 10.3629V12.8365C10.3617 13.8272 9.55787 14.6303 8.56797 14.6303H3.17365C2.18298 14.6303 1.37988 13.8272 1.37988 12.8365V7.44221C1.37988 6.45077 2.18298 5.64844 3.17365 5.64844H5.64726V8.56915C5.64726 9.55982 6.45036 10.3629 7.44103 10.3629H10.3617Z"
        fill={color}
      />
      <path
        d="M14.6291 3.17365V8.56797C14.6291 9.55864 13.826 10.3617 12.8353 10.3617H10.3625V7.44103C10.3625 6.44959 9.55864 5.64726 8.56874 5.64726H5.64803V3.17365C5.64803 2.18298 6.45113 1.37988 7.44179 1.37988H12.8361C13.8275 1.37988 14.6291 2.18375 14.6291 3.17365Z"
        fill={color}
      />
    </IconWrapper>
  );
}
