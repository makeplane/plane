// @ts-nocheck

import suggestion from "./suggestion";
import { CustomMention } from "./custom";
import { IMentionSuggestion } from "./mentions";

export const Mentions = (mentionSuggestions: IMentionSuggestion[]) => CustomMention.configure({
  HTMLAttributes: {
    'class' : "mention",
  },
  suggestion: suggestion(mentionSuggestions),
})

