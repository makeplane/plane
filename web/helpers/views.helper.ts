import { Globe2, Lock, LucideIcon } from "lucide-react";
import { VIEW_ACCESS_SPECIFIERS as VIEW_ACCESS_SPECIFIERS_CONSTANTS } from "@plane/constants";
import { EViewAccess } from "@plane/types";

const VIEW_ACCESS_ICONS = {
  [EViewAccess.PUBLIC]: Globe2,
  [EViewAccess.PRIVATE]: Lock,
};
export const VIEW_ACCESS_SPECIFIERS: {
  key: EViewAccess;
  i18n_label: string;
  icon: LucideIcon;
}[] = VIEW_ACCESS_SPECIFIERS_CONSTANTS.map((option) => ({
  ...option,
  icon: VIEW_ACCESS_ICONS[option.key as keyof typeof VIEW_ACCESS_ICONS],
}));
