import * as React from "react";

import { IconWrapper } from "./icon-wrapper";
import { ISvgIcons } from "./type";

export const DefaultIcon: React.FC<ISvgIcons> = ({ color = "currentColor", ...rest }) => (
  <IconWrapper color={color} {...rest}>
    <rect x="4" y="4" width="8" height="8" rx="1" fill={color} />
  </IconWrapper>
);
