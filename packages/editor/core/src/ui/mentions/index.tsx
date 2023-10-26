// @ts-nocheck

import suggestion from "./suggestion";
import { CustomMention } from "./custom";
import { IMentionHighlight, IMentionSuggestion } from "./mentions";

export const Mentions = (mentionSuggestions: IMentionSuggestion[], mentionHighlights: IMentionHighlight[]) => CustomMention.configure({
  HTMLAttributes: {
    'class' : "mention",
  },
  mentionHighlights: mentionHighlights,
  suggestion: suggestion(mentionSuggestions),
})

