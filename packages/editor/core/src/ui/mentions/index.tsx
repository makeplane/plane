// @ts-nocheck

import suggestion from "./suggestion";
import { CustomMention } from "./custom";
import { IMentionHighlight, IMentionSuggestion } from "@plane/editor-types";

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
