import * as React from "react";

import type { IconName } from "./registry";
import { ICON_REGISTRY } from "./registry";
import type { ISvgIcons } from "./type";

export interface IconProps extends Omit<ISvgIcons, "ref"> {
  name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_REGISTRY[name] || ICON_REGISTRY.default;
  return <IconComponent {...props} />;
};
