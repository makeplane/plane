/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TPageLinkSearchResult = {
  id: string;
  name: string;
  logo_props?: Record<string, unknown> | null;
  project_id?: string;
};

export type IEditorExtensionOptions = unknown;

export type IEditorPropsExtended = {
  onLinkClick?: (href: string, event: MouseEvent) => boolean | void;
  isInternalPageLink?: (href: string) => boolean;
  searchPages?: (query: string) => Promise<TPageLinkSearchResult[]>;
  buildPageLink?: (pageId: string, projectId?: string) => string;
};

export type ICollaborativeDocumentEditorPropsExtended = unknown;

export type TExtendedEditorCommands = never;

export type TExtendedCommandExtraProps = unknown;

export type TExtendedEditorRefApi = unknown;
