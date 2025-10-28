import * as React from "react";

import { ICON_REGISTRY, IconName } from "./registry";
import { ISvgIcons } from "./type";

export interface IconProps extends Omit<ISvgIcons, "ref"> {
  name: IconName;
}

export const Icon: React.FC<IconProps> = ({ name, ...props }) => {
  const IconComponent = ICON_REGISTRY[name] || ICON_REGISTRY.default;
  return <IconComponent {...props} />;
};
