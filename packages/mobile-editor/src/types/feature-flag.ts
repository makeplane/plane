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

export enum E_FEATURE_FLAGS {
  COLLABORATION_CURSOR = "collaborationCursor",
  EDITOR_AI_OPS = "editorAIOps",
  PAGE_ISSUE_EMBEDS = "pageIssueEmbeds",
  NESTED_PAGES = "nestedPages",
  EDITOR_ATTACHMENTS = "editorAttachments",
  VIDEO_ATTACHMENTS = "videoAttachments",
  EDITOR_MATHEMATICS = "editorMathematics",
  EDITOR_EXTERNAL_EMBEDS = "editorExternalEmbeds",
  COMMENTS = "pageComments",
}

export type TFeatureFlagsResponse = {
  [featureFlag in E_FEATURE_FLAGS]: boolean;
};
