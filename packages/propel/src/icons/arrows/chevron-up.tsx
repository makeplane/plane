import * as React from "react";

import { IconWrapper } from "../icon-wrapper";
import type { ISvgIcons } from "../type";

export function ChevronUpIcon({ color = "currentColor", ...rest }: ISvgIcons) {
  return (
    <IconWrapper color={color} clipPathId="clip0_2890_23" {...rest}>
      <path
        d="M7.6562 5.47785C7.89877 5.3179 8.22886 5.34445 8.44234 5.55793L12.4423 9.55793C12.6864 9.80201 12.6864 10.1986 12.4423 10.4427C12.1983 10.6868 11.8016 10.6868 11.5576 10.4427L7.99995 6.88508L4.44234 10.4427C4.19826 10.6868 3.80165 10.6868 3.55757 10.4427C3.31349 10.1986 3.31349 9.80201 3.55757 9.55793L7.55757 5.55793L7.6562 5.47785Z"
        fill={color}
      />
    </IconWrapper>
  );
}
