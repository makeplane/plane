import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
// local imports
import suggestion from "./suggestion";

export const EmojiExtension = Emoji.configure({
  emojis: gitHubEmojis,
  suggestion: suggestion,
  enableEmoticons: true,
});
