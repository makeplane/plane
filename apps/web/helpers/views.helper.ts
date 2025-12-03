import type { LucideIcon } from "lucide-react";
import { Globe2 } from "lucide-react";
import { VIEW_ACCESS_SPECIFIERS as VIEW_ACCESS_SPECIFIERS_CONSTANTS } from "@plane/constants";
import { LockIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import { EViewAccess } from "@plane/types";

const VIEW_ACCESS_ICONS = {
  [EViewAccess.PUBLIC]: Globe2,
  [EViewAccess.PRIVATE]: LockIcon,
};
export const VIEW_ACCESS_SPECIFIERS: {
  key: EViewAccess;
  i18n_label: string;
  icon: LucideIcon | React.FC<ISvgIcons>;
}[] = VIEW_ACCESS_SPECIFIERS_CONSTANTS.map((option) => ({
  ...option,
  icon: VIEW_ACCESS_ICONS[option.key as keyof typeof VIEW_ACCESS_ICONS],
}));
