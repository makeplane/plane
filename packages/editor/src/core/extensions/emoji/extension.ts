import Emoji, { EmojiItem, gitHubEmojis, shortcodeToEmoji } from "@tiptap/extension-emoji";
// local imports
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import suggestion from "./suggestion";

export const EmojiExtension = Emoji.extend({
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis)
          if(emojiItem?.emoji) {
            state.write(emojiItem?.emoji);
          } else if(emojiItem?.fallbackImage) {
            state.write(`\n![${emojiItem.name}-${emojiItem.shortcodes[0]}](${emojiItem?.fallbackImage})\n`);
          } else {
            state.write(`:${node.attrs.name}:`);
          }
        },
      },

    };
  },
}).configure({
  emojis: gitHubEmojis,
  suggestion: suggestion,
  enableEmoticons: true,
});
