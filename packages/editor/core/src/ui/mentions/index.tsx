// @ts-nocheck

import { Suggestion } from "src/ui/mentions/suggestion";
import { CustomMention } from "src/ui/mentions/custom";
import { IMentionHighlight, IMentionSuggestion } from "@plane/editor-types";

export const Mentions = (mentionSuggestions: IMentionSuggestion[], mentionHighlights: IMentionHighlight[], readonly) =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    readonly: readonly,
    mentionHighlights: mentionHighlights,
    suggestion: Suggestion(mentionSuggestions),
  });
