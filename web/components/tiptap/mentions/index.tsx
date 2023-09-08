import Mention from "@tiptap/extension-mention";
import suggestion from "./suggestion";

export const Mentions = Mention.configure({
  HTMLAttributes: {
    class: 'mention',
  },
  suggestion: suggestion,
})
