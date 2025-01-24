export enum E_FEATURE_FLAGS {
  ISSUE_TYPES = "ISSUE_TYPES",
}

export type TFeatureFlags = keyof typeof E_FEATURE_FLAGS;
