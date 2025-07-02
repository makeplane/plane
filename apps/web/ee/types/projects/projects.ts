import {
  IPartialProject,
  TProjectAttributes as TProjectAttributesExport,
  TProjectAttributesParams as TProjectAttributesParamsExport,
  TProjectAttributesResponse as TProjectAttributesResponseExport,
  TProject as TProjectExport,
  TProjectFeaturesList as TProjectFeaturesListExport,
  TProjectFeatures as TProjectFeaturesExport,
} from "@plane/types";

// Re-exporting from here to avoid import changes in other files
// TODO: Remove this once all the imports are updated

export type TPartialProject = IPartialProject;

export type TProjectAttributes = TProjectAttributesExport;

export type TProjectAttributesParams = TProjectAttributesParamsExport;

export type TProjectAttributesResponse = TProjectAttributesResponseExport;

export type TProject = TProjectExport;

export type TProjectFeaturesList = TProjectFeaturesListExport;

export type TProjectFeatures = TProjectFeaturesExport;
