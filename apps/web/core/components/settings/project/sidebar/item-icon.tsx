import type { LucideIcon } from "lucide-react";
import { Users } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import { EstimatePropertyIcon, LabelPropertyIcon, StatePropertyIcon } from "@plane/propel/icons";
import type { TProjectSettingsTabs } from "@plane/types";
// components
import { SettingIcon } from "@/components/icons/attachment";

export const PROJECT_SETTINGS_ICONS: Record<TProjectSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: SettingIcon,
  members: Users,
  features: SettingIcon,
  states: StatePropertyIcon,
  labels: LabelPropertyIcon,
  estimates: EstimatePropertyIcon,
  automations: SettingIcon,
};
