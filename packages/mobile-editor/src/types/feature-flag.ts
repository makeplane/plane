export enum E_FEATURE_FLAGS {
  COLLABORATION_CURSOR = "collaborationCursor",
  EDITOR_AI_OPS = "editorAIOps",
  PAGE_ISSUE_EMBEDS = "pageIssueEmbeds",
}

export type TFeatureFlagsResponse = {
  [featureFlag in E_FEATURE_FLAGS]: boolean;
};
