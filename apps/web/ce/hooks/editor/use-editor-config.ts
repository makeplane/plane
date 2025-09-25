export type TExtendedEditorConfigArgs = {
  projectId?: string;
  workspaceSlug: string;
};

export type TExtendedEditorConfig = object;
export const extendedEditorConfig = (_args: TExtendedEditorConfigArgs): TExtendedEditorConfig => ({});
