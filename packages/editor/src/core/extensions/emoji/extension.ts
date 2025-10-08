// local imports
import { gitHubEmojis, shortcodeToEmoji } from "@tiptap/extension-emoji";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Emoji } from "./emoji";
import { emojiSuggestion } from "./suggestion";

export const EmojiExtension = Emoji.extend({
  addStorage() {
    const extensionOptions = this.options;

    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const emojiItem = shortcodeToEmoji(node.attrs.name, extensionOptions.emojis);
          if (emojiItem?.emoji) {
            state.write(emojiItem?.emoji);
          } else if (emojiItem?.fallbackImage) {
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
  suggestion: emojiSuggestion,
  enableEmoticons: true,
});
