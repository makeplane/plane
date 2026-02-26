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

export class CallbackHandlerStrings {
  // Utility callbacks
  static readonly getVariant = "getVariant";
  static readonly getActiveToolbarState = "getActiveToolbarState";
  static readonly onEditorFocused = "onEditorFocused";
  static readonly onEditorReady = "onEditorReady";
  static readonly getInitialEditorParams = "getInitialEditorParams";
  static readonly getInitialDocumentEditorParams = "getInitialDocumentEditorParams";
  static readonly onCursorPositionChange = "onCursorPositionChange";
  static readonly onEditorClick = "onEditorClick";
  static readonly onInitialContentLoad = "onInitialContentLoad";
  static readonly onContentChange = "onContentChange";
  static readonly onNodeSelection = "onNodeSelection";
  static readonly getSelectedNodes = "getSelectedNodes";
  static readonly onOpenLink = "onOpenLink";
  static readonly onOpenWorkItemDetails = "onOpenWorkItemDetails";
  static readonly onContentSizeChange = "onContentSizeChange";
  // Mention callbacks
  static readonly fetchMembers = "fetchMembers";
  static readonly fetchAllMentions = "fetchAllMentions";
  static readonly fetchWorkItemMentionById = "fetchWorkItemMentionById";
  // Feature flag callbacks
  static readonly getFeatureFlags = "getFeatureFlags";
  // Asset callbacks
  static readonly getResolvedImageUrl = "getResolvedImageUrl";
  static readonly getDownloadAssetSrc = "getDownloadAssetSrc";
  static readonly uploadImage = "uploadImage";
  static readonly deleteImage = "deleteImage";
  static readonly restoreImage = "restoreImage";
  static readonly checkIfAssetExists = "checkIfAssetExists";
  static readonly onAttachmentBlockClick = "onAttachmentClick";
  // Issue embed callbacks
  static readonly getProjectIdentifier = "getProjectIdentifier";
  static readonly getIssueDetails = "getIssueDetails";
  // Page embed callbacks
  static readonly onPageEmbedClick = "onPageEmbedClick";
  // Page actions callbacks
  static readonly getCollaborativeDocumentEvents = "getCollaborativeDocumentEvents";
  static readonly getPageAccess = "getPageAccess";
  static readonly onPageTitleTap = "onPageTitleTap";
  static readonly canAccessPage = "canAccessPage";
  static readonly getPages = "getPages";
  static readonly getPageDetails = "getPageDetails";
  static readonly archivePage = "archivePage";
  static readonly restorePage = "restorePage";
  static readonly deleteSubPages = "deleteSubPages";
  static readonly updatePageTitle = "updatePageTitle";
  static readonly pageMoved = "pageMoved";
  static readonly pageMovedInternally = "pageMovedInternally";

  // Math callbacks
  static readonly updateMathEquation = "updateMathEquation";

  // External embed callbacks
  static readonly fetchExternalEmbed = "fetchExternalEmbed";
  static readonly onExternalEmbedBlockClick = "onExternalEmbedBlockClick";

  // Page inline comments
  static readonly onCommentClick = "onCommentClick";
  static readonly onCommentResolve = "onCommentResolve";

  // Drawio callbacks
  static readonly onDrawioBlockClick = "onDrawioBlockClick";
}
