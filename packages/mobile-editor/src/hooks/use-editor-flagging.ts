import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
import { callNative } from "@/helpers/flutter-callback.helper";
import { TFeatureFlagsResponse } from "@/types/feature-flag";
import { TExtensions } from "@plane/editor";
import { useEffect, useState } from "react";

/**
 * @description extensions disabled in various editors
 */
export const useEditorFlagging = (): {
  disabledExtensions?: TExtensions[];
  isIssueEmbedEnabled: boolean;
} => {
  const [featureFlags, setFeatureFlags] = useState<TFeatureFlagsResponse | null>(null);
  const [disabledExtensions, setDocumentEditor] = useState<TExtensions[] | undefined>(undefined);

  // get the feature flags from the native code
  useEffect(() => {
    callNative(CallbackHandlerStrings.getFeatureFlags).then((flags: string) => {
      console.log(flags);
      setFeatureFlags(JSON.parse(flags));
      setDocumentEditor([]);
    });
  }, []);

  const isIssueEmbedEnabled = featureFlags?.pageIssueEmbeds ?? false;
  const isCollaborationCursorEnabled = featureFlags?.collaborationCursor ?? false;

  // extensions disabled in the document editor
  if (!isIssueEmbedEnabled) disabledExtensions?.push("issue-embed");
  if (!isCollaborationCursorEnabled) disabledExtensions?.push("collaboration-cursor");
  return {
    disabledExtensions,
    isIssueEmbedEnabled,
  };
};
