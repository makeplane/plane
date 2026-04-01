import type { IProject } from "@plane/types";

import type { TSupportedFlagsForUpgrade } from "@/constants/feature-flag";

export type DefaultAutomationType = keyof Pick<IProject, "archive_in" | "close_in" | "auto_reminder_days">;

export type DefaultAutomationContentType = "archive_in" | "close_in" | "close_in_status" | "auto_reminder_days";

export type DefaultAutomationContentProps = {
  workspaceSlug: string;
  projectId: string;
  value?: number;
  i18n_button_label?: string;
  handleChange?: (payload: Partial<IProject>) => void;
};

export type DefaultAutomationContent = {
  type: DefaultAutomationContentType;
  i18n_name: string;
  component: React.ComponentType<DefaultAutomationContentProps>;
  i18n_button_label?: string;
};

export type DefaultAutomation = {
  type: DefaultAutomationType;
  i18n_name: string;
  i18n_description: string;
  defaultValue: number;
  content: DefaultAutomationContent[];
  feature_flag?: TSupportedFlagsForUpgrade;
};
