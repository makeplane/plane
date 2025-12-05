import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function ChevronDownIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M11.5576 5.55708C11.8016 5.313 12.1983 5.313 12.4423 5.55708C12.6864 5.80116 12.6864 6.19777 12.4423 6.44185L8.44234 10.4418C8.19826 10.6859 7.80165 10.6859 7.55757 10.4418L3.55757 6.44185C3.31349 6.19777 3.31349 5.80116 3.55757 5.55708C3.80165 5.313 4.19826 5.313 4.44234 5.55708L7.99995 9.1147L11.5576 5.55708Z"
        fill={color}
      />
    </IconWrapper>
  );
}
