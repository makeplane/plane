// types
import { Editor } from "@tiptap/react";
import { TPage } from "@plane/types";
import { TEmbedItem } from "@/types";
import { PageEmbedExtensionAttributes } from "../extensions/page-embed/extension-config";

export type TEmbedConfig = {
  issue?: TIssueEmbedConfig;
  page?: TPageEmbedConfig;
};

export type TReadOnlyEmbedConfig = {
  issue?: Omit<TIssueEmbedConfig, "searchCallback">;
  page?: Omit<TPageEmbedConfig, "createCallback" | "searchCallback">;
};

export type TIssueEmbedConfig = {
  searchCallback?: (searchQuery: string) => Promise<TEmbedItem[]>;
  widgetCallback: ({
    issueId,
    projectId,
    workspaceSlug,
  }: {
    issueId: string;
    projectId: string | undefined;
    workspaceSlug: string | undefined;
  }) => React.ReactNode;
};

export type TPageEmbedConfig = {
  createCallback?: () => Promise<
    | {
        pageId: string;
        workspaceSlug: string;
      }
    | undefined
  >;
  searchCallback?: (searchQuery: string) => Promise<TEmbedItem[]>;
  widgetCallback: ({
    pageId,
    workspaceSlug,
    editor,
    updateAttributes,
  }: {
    pageId: string;
    workspaceSlug: string | undefined;
    editor?: Editor;
    updateAttributes?: (attrs: Partial<PageEmbedExtensionAttributes>) => void;
  }) => React.ReactNode;
  archivePage?: (id: string) => Promise<void>;
  unarchivePage?: (id: string) => Promise<void>;
  getSubPagesCallback?: () => string[];
  getPageDetailsCallback?: (pageId: string) => TPage;
  deletePage?: (id: string[]) => Promise<void>;
  updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  workspaceSlug: string;
};

export type TPageEmbedNodeViewRendererProps = {
  node: { attrs: PageEmbedExtensionAttributes };
  editor: Editor;
  updateAttributes: (attrs: Partial<PageEmbedExtensionAttributes>) => void;
};

export type TPageLinkConfig = {
  widgetCallback: ({
    pageId,
    workspaceSlug,
    projectId,
    name,
  }: {
    pageId: string;
    workspaceSlug: string | undefined;
    projectId: string | undefined;
    name?: string;
  }) => React.ReactNode;
  workspaceSlug: string;
};
