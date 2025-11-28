import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function ChevronRightIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M5.55757 3.55708C5.80165 3.313 6.19826 3.313 6.44234 3.55708L10.4423 7.55708C10.6864 7.80116 10.6864 8.19777 10.4423 8.44185L6.44234 12.4418C6.19826 12.6859 5.80165 12.6859 5.55757 12.4418C5.31349 12.1978 5.31349 11.8012 5.55757 11.5571L9.11519 7.99946L5.55757 4.44185C5.31349 4.19777 5.31349 3.80116 5.55757 3.55708Z"
        fill={color}
      />
    </IconWrapper>
  );
}
