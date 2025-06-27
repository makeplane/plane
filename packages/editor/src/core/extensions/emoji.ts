import Emoji, { gitHubEmojis } from "@tiptap/extension-emoji";
import suggestion from "@/components/menus/emoji/suggestion";

export const EmojiExtension = Emoji.configure({
  emojis: gitHubEmojis,
  enableEmoticons: true,
  suggestion: suggestion,
});
