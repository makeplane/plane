// @ts-nocheck

import { Suggestion } from "src/ui/mentions/suggestion";
import { CustomMention } from "src/ui/mentions/custom";
import { IMentionHighlight } from "src/types/mention-suggestion";

export const Mentions = (mentionSuggestions: IMentionSuggestion[], mentionHighlights: IMentionHighlight[], readonly) =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    readonly: readonly,
    mentionHighlights: mentionHighlights,
    suggestion: Suggestion(mentionSuggestions),
  });
