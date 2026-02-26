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

export type TEditorParams = {
  autoFocus: boolean;
  currentUserId: string;
  content: string;
  placeholder: string;
  variant: TEditorVariant;
  editable: boolean;
  workspaceSlug: string;
  userDisplayName: string;
  cookie: string;
  liveServerUrl: string;
  token: string;
  scrollMargin?: number;
};
export type TDocumentEditorParams = {
  editable: boolean;
  isSelfHosted: boolean;
  pageId: string;
  documentType: string;
  workspaceSlug: string;
  projectId?: string;
  parentPageId?: string;
  currentUserId: string;
  userDisplayName: string;
  cookie: string;
  liveServerUrl: string;
  liveServerBasePath: string;
};
export enum TEditorVariant {
  sticky = "sticky",
  lite = "lite",
  rich = "rich",
  document = "document",
}
export type TScrollIntoViewProps = {
  variant: TEditorVariant;

  scrollBehavior?: ScrollBehavior;
  extraPadding?: number;
  scrollMargin?: number;
};

export type TOnEditorFocusProps = {
  variant: TEditorVariant;
  scrollIntoView?: boolean;
};
