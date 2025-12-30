// local imports
import { gitHubEmojis, shortcodeToEmoji } from "@tiptap/extension-emoji";
import type { MarkdownSerializerState } from "@tiptap/pm/markdown";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
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
          } else {
            state.write(`:${node.attrs.name}:`);
          }
        },
      },
    };
  },
}).configure({
  // Filter out emojis without emoji value and remove fallbackImage property to prevent CDN calls

  emojis: gitHubEmojis.filter((item) => item.emoji).map(({ fallbackImage, ...emoji }) => emoji),
  suggestion: emojiSuggestion,
  enableEmoticons: true,
});
