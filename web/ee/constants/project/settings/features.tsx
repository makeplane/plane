import { ListTodo, Mail, Zap } from "lucide-react";
// plane imports
import {
  PROJECT_BASE_FEATURES_LIST as CE_PROJECT_BASE_FEATURES_LIST,
  PROJECT_OTHER_FEATURES_LIST as CE_PROJECT_OTHER_FEATURES_LIST,
  PROJECT_FEATURES_LIST as CE_PROJECT_FEATURES_LIST,
  TProperties,
} from "@/ce/constants/project/settings/features";

export type TIntakeFeatureKeys = "in_app" | "email" | "form";

type TIntakeFeatureList = {
  [key in TIntakeFeatureKeys]: TProperties & {
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

export const PROJECT_BASE_FEATURES_LIST = {
  ...CE_PROJECT_BASE_FEATURES_LIST,
};

export const PROJECT_OTHER_FEATURES_LIST = {
  ...CE_PROJECT_OTHER_FEATURES_LIST,
  is_time_tracking_enabled: {
    ...CE_PROJECT_OTHER_FEATURES_LIST.is_time_tracking_enabled,
    isEnabled: true,
    isPro: true,
  },
};

export const PROJECT_FEATURES_LIST = {
  ...CE_PROJECT_FEATURES_LIST,
  project_features: {
    ...CE_PROJECT_FEATURES_LIST.project_features,
    featureList: PROJECT_BASE_FEATURES_LIST,
  },
  project_others: {
    ...CE_PROJECT_FEATURES_LIST.project_others,
    featureList: PROJECT_OTHER_FEATURES_LIST,
  },
};

export const PROJECT_FEATURES_LIST_FOR_TEMPLATE = {
  ...PROJECT_BASE_FEATURES_LIST,
  ...PROJECT_OTHER_FEATURES_LIST,
  inbox: {
    ...PROJECT_BASE_FEATURES_LIST.inbox,
    property: "intake_view", // TODO: Remove this once the property is updated in original constant
  },
};

export type TProjectFeatureForTemplateKeys = keyof typeof PROJECT_FEATURES_LIST_FOR_TEMPLATE;
