import {
  TFeatureList,
  TProjectFeatures,
  PROJECT_FEATURES_LIST,
  TProperties,
} from "ce/constants/project/settings/features";
import { ListTodo, Mail, Zap } from "lucide-react";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import IntakeSubFeatures from "@/plane-web/components/projects/settings/intake/intake-sub-features";

PROJECT_FEATURES_LIST.project_features.featureList.inbox.renderChildren = (
  currentProjectDetails,
  isAdmin,
  handleSubmit,
  workspaceSlug
) => (
  <WithFeatureFlagHOC workspaceSlug={workspaceSlug?.toString()} flag="INTAKE_SETTINGS" fallback={<></>}>
    <IntakeSubFeatures projectId={currentProjectDetails.id} isAdmin={isAdmin} handleSubmit={handleSubmit} />
  </WithFeatureFlagHOC>
);

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
    description: "Let the Plane app users in your org add issues via intake",
    icon: <Zap className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: false,
  },
  // email: {
  //   property: "email",
  //   title: "Email",
  //   description: "You can send or forward emails to this address to create tasks and attach the email to them",
  //   icon: <Mail className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
  //   isPro: false,
  //   isEnabled: true,
  //   hasOptions: true,
  //   hasHyperlink: false,
  //   canShuffle: true,
  // },
  form: {
    property: "form",
    title: "Forms",
    description: "You can share this link to get tasks created directly from the Web",
    icon: <ListTodo className="h-4 w-4 flex-shrink-0 text-custom-text-300" />,
    isPro: false,
    isEnabled: true,
    hasOptions: true,
    hasHyperlink: true,
    canShuffle: true,
  },
};

export type { TFeatureList, TProjectFeatures };
export { PROJECT_FEATURES_LIST };
