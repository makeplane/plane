import { TFeatureList, TProjectFeatures, PROJECT_FEATURES_LIST } from "ce/constants/project/settings/features";

PROJECT_FEATURES_LIST.project_others.featureList.is_time_tracking_enabled = {
  ...PROJECT_FEATURES_LIST.project_others.featureList.is_time_tracking_enabled,
  isEnabled: true,
  isPro: true,
};

export type { TFeatureList, TProjectFeatures };
export { PROJECT_FEATURES_LIST };
