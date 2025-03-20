import { ListTodo, Mail, Zap } from "lucide-react";
import {
  TFeatureList,
  TProjectFeatures,
  PROJECT_FEATURES_LIST,
  TProperties,
} from "@/ce/constants/project/settings/features";

PROJECT_FEATURES_LIST.project_others.featureList.is_time_tracking_enabled = {
  ...PROJECT_FEATURES_LIST.project_others.featureList.is_time_tracking_enabled,
  isEnabled: true,
  isPro: true,
};
export type TIntakeFeatureList = {
  [key: string]: TProperties & {
    hasOptions: boolean;
    hasHyperlink?: boolean;
    canShuffle?: boolean;
  };
};
export const INTAKE_FEATURES_LIST: TIntakeFeatureList = {
  in_app: {
    property: "in_app",
    title: "In-app",
    description:
      "Get new work items from Members and Guests in your workspace without disruption to your existing work items.",
    icon: <Zap className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: false,
    key: "in_app",
  },
  email: {
    property: "email",
    title: "Email",
    description: "Collect new work items from anyone who sends an email to a Plane email address.",
    icon: <Mail className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: false,
    canShuffle: true,
    key: "intake_email",
  },
  form: {
    property: "form",
    title: "Forms",
    description:
      "Let folks outside your workspace create potential new work items for you via a dedicated and secure form.",
    icon: <ListTodo className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: true,
    canShuffle: true,
    key: "intake",
  },
};

export type { TFeatureList, TProjectFeatures };
export { PROJECT_FEATURES_LIST };
