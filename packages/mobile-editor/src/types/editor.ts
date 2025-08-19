type TBaseEditorParams = {
  workspaceSlug: string;
  workspaceId: string;
  placeholder?: string;
  baseApi: string;
  variant: TEditorVariant;
};
export type TEditorParams = TBaseEditorParams & {
  content: string;
  projectId?: string;
};
export type TDocumentEditorParams = TBaseEditorParams & {
  pageId: string;
  documentType: string;
  projectId?: string;
  userId: string;
  userDisplayName: string;
  cookie: string;
  liveServerUrl: string;
  liveServerBasePath: string;
};
export enum TEditorVariant {
  lite = "lite",
  rich = "rich",
  document = "document",
}
