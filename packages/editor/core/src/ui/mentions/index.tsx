// @ts-nocheck

import suggestion from "./suggestion";
import { CustomMention } from "./custom";
import {
  IMentionHighlight,
  IMentionSuggestion,
} from "../../types/mention-suggestion";

export const Mentions = (
  mentionSuggestions: IMentionSuggestion[],
  mentionHighlights: IMentionHighlight[],
  readonly,
) =>
  CustomMention.configure({
    HTMLAttributes: {
      class: "mention",
    },
    readonly: readonly,
    mentionHighlights: mentionHighlights,
    suggestion: suggestion(mentionSuggestions),
  });
