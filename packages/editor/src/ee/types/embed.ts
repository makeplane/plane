/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Editor } from "@tiptap/react";
// plane imports
import type { TPage } from "@plane/types";
// types
import type { ExternalEmbedNodeViewProps, TEmbedItem } from "@/types";
// local imports
import type { PageEmbedExtensionAttributes } from "../extensions/page-embed/extension-config";
import type { TPageNodesInfo } from "../extensions/page-embed/plugins/order-tracker-plugin";

export type TEmbedConfig = {
  issue?: TIssueEmbedConfig;
  page?: TPageEmbedConfig;
  externalEmbedComponent?: TExternalEmbedConfig;
  piUtilityEmbed?: TPiUtilityEmbedConfig;
};

export type TPiUtilityEmbedConfig = {
  widgetCallback: (props: {
    embedId: string;
    embedType?: string | null;
    subType?: string | null;
    title?: string | null;
  }) => React.ReactNode;
};

export type TReadOnlyEmbedConfig = {
  issue?: Omit<TIssueEmbedConfig, "searchCallback">;
  page?: Omit<TPageEmbedConfig, "createCallback" | "searchCallback">;
  externalEmbedComponent?: TExternalEmbedConfig;
};

export type TExternalEmbedConfig = {
  widgetCallback: (props: ExternalEmbedNodeViewProps) => React.ReactNode;
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
  createCallback?: (index: number) => Promise<
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
  onNodesPosChanged?: (nodes: TPageNodesInfo[]) => void;
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
