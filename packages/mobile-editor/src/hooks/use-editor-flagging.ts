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

import { useCallback, useEffect, useMemo, useState } from "react";
import type { TExtensions } from "@plane/editor";
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative } from "@/helpers/flutter-callback.helper";
import type { TFeatureFlagsResponse } from "@/types/feature-flag";

/**
 * @description extensions disabled in various editors
 */

const disabledExtensions: TExtensions[] = ["ai", "slash-commands"];

export const useEditorFlagging = () => {
  const [featureFlags, setFeatureFlags] = useState<TFeatureFlagsResponse | null>(null);

  const getFeatureFlags = useCallback(async () => {
    try {
      const flags = await callNative<string>(CallbackHandlerStrings.getFeatureFlags);
      setFeatureFlags(JSON.parse(flags ?? "{}") as TFeatureFlagsResponse);
    } catch (error) {
      console.error("Error fetching feature flags", error);
    }
  }, []);

  // Get the feature flags from the native code
  useEffect(() => {
    void getFeatureFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editorConfig = useMemo(() => {
    const isWorkItemEmbedEnabled = featureFlags?.pageIssueEmbeds ?? false;
    const isCollaborationCursorEnabled = featureFlags?.collaborationCursor ?? false;
    const isNestedPagesEnabled = featureFlags?.nestedPages ?? false;
    const isEditorAttachmentsEnabled = featureFlags?.editorAttachments ?? false;
    const isVideoAttachmentsEnabled = featureFlags?.videoAttachments ?? false;
    const isEditorMathematicsEnabled = featureFlags?.editorMathematics ?? false;
    const isExternalEmbedEnabled = featureFlags?.editorExternalEmbeds ?? false;
    const isCommentsEnabled = featureFlags?.pageComments ?? false;

    const documentFlaggedArr: TExtensions[] = [];
    const documentDisabledArr = [...disabledExtensions];
    const richTextFlaggedArr: TExtensions[] = [];
    const liteTextFlaggedArr: TExtensions[] = [];

    if (!isWorkItemEmbedEnabled) {
      documentFlaggedArr.push("issue-embed");
    }
    if (!isCollaborationCursorEnabled) {
      documentDisabledArr.push("collaboration-caret");
    }
    if (!isNestedPagesEnabled) {
      documentFlaggedArr.push("nested-pages");
    }
    if (!isEditorAttachmentsEnabled) {
      documentFlaggedArr.push("attachments");
      richTextFlaggedArr.push("attachments");
      liteTextFlaggedArr.push("attachments");
    }
    if (!isVideoAttachmentsEnabled) {
      documentFlaggedArr.push("video-attachments");
      richTextFlaggedArr.push("video-attachments");
      liteTextFlaggedArr.push("video-attachments");
    }
    if (!isEditorMathematicsEnabled) {
      documentFlaggedArr.push("mathematics");
      richTextFlaggedArr.push("mathematics");
      liteTextFlaggedArr.push("mathematics");
    }
    if (!isExternalEmbedEnabled) {
      documentFlaggedArr.push("external-embed");
      richTextFlaggedArr.push("external-embed");
      liteTextFlaggedArr.push("external-embed");
    }

    if (!isCommentsEnabled) {
      documentFlaggedArr.push("comments");
    }

    return {
      document: {
        disabled: documentDisabledArr,
        flagged: documentFlaggedArr,
      },
      liteText: {
        disabled: <TExtensions[]>[...disabledExtensions, "enter-key", "external-embed"],
        flagged: liteTextFlaggedArr,
      },
      richText: {
        disabled: disabledExtensions,
        flagged: richTextFlaggedArr,
      },
    };
  }, [featureFlags]);

  return editorConfig;
};
