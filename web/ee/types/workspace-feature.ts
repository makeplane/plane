export enum EWorkspaceFeatureLoader {
  INIT_LOADER = "workspace-feature-init-loader",
  MUTATION_LOADER = "workspace-feature-mutation-loader",
}

export type TWorkspaceFeatureLoader = EWorkspaceFeatureLoader | undefined;

// workspace feature
export enum EWorkspaceFeatures {
  IS_PROJECT_GROUPING_ENABLED = "is_project_grouping_enabled",
}

export type TWorkspaceFeature = { [key in EWorkspaceFeatures]: boolean | undefined };

export type TWorkspaceFeatures = {
  workspace: string | undefined;
  created_at: string | undefined;
  updated_at: string | undefined;
} & TWorkspaceFeature;
