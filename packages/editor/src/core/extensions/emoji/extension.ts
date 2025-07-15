// local imports
import { gitHubEmojis, shortcodeToEmoji } from "@tiptap/extension-emoji";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Emoji, EmojiOptions } from "./emoji";
import suggestion from "./suggestion";

export interface ExtendedEmojiOptions extends EmojiOptions {
  showSuggestion: boolean;
}

export const EmojiExtension = Emoji.extend<ExtendedEmojiOptions>({
  addOptions() {
    return {
      ...this.parent?.(),
      showSuggestion: true,
    };
  },

  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
          const emojiItem = shortcodeToEmoji(node.attrs.name, this.options.emojis);
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

  addProseMirrorPlugins() {
    const parentPlugins = this.parent?.() || [];

    // If showSuggestion is false, filter out the Suggestion plugin
    if (!this.options.showSuggestion) {
      // Return only the emoji plugin (second plugin from parent)
      return parentPlugins.filter((plugin, index) => index !== 0);
    }

    // If showSuggestion is true, return all parent plugins
    return parentPlugins;
  },
}).configure({
  emojis: gitHubEmojis,
  suggestion: suggestion,
  enableEmoticons: true,
  showSuggestion: true,
});
