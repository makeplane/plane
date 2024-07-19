import {
  TFeatureList,
  TProjectFeatures,
  PROJECT_FEATURES_LIST as PROJECT_FEATURES_LIST_CE,
} from "ce/constants/project/settings/features";

export const PROJECT_FEATURES_LIST: TProjectFeatures = {
  project_features: PROJECT_FEATURES_LIST_CE.project_features,
};

export type { TFeatureList, TProjectFeatures };
