/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPageEmbedSuggestion = {
  id: string;
  entity_identifier: string;
  project_identifier: string | undefined;
  workspace_identifier: string | undefined;
  title: string;
  icon: React.ReactNode;
};

export type TPageEmbedSection = {
  key: string;
  title?: string;
  items: TPageEmbedSuggestion[];
};

export type TPageEmbedHandler = {
  searchCallback: (query: string) => Promise<TPageEmbedSection[]>;
  // called when "New page" is picked, the created page is then embedded
  onCreate?: (name: string) => Promise<TPageEmbedSuggestion | undefined>;
  widgetCallback: (props: {
    pageId: string;
    projectId: string | undefined;
    workspaceSlug: string | undefined;
  }) => React.ReactNode;
};
