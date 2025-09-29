import type { EmojiOptions } from "@tiptap/extension-emoji";
import { ReactRenderer, type Editor } from "@tiptap/react";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// local imports
import { type EmojiItem, EmojiList, type EmojiListRef } from "./components/emojis-list";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

export const emojiSuggestion: EmojiOptions["suggestion"] = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    const { emojis, isSupported } = editor.storage.emoji;
    const filteredEmojis = emojis.filter((emoji) => {
      const hasEmoji = !!emoji?.emoji;
      const hasFallbackImage = !!emoji?.fallbackImage;
      const renderFallbackImage =
        (emoji.forceFallbackImages && !hasEmoji) ||
        (emoji.forceFallbackImages && hasFallbackImage) ||
        (emoji.forceFallbackImages && !isSupported(emoji) && hasFallbackImage) ||
        ((!isSupported(emoji) || !hasEmoji) && hasFallbackImage);
      return !renderFallbackImage;
    });

    if (query.trim() === "") {
      const defaultEmojis = DEFAULT_EMOJIS.map((name) =>
        filteredEmojis.find((emoji) => emoji.shortcodes.includes(name) || emoji.name === name)
      )
        .filter(Boolean)
        .slice(0, 5);
      return defaultEmojis as EmojiItem[];
    }
    return filteredEmojis
      .filter(({ shortcodes, tags }) => {
        const lowerQuery = query.toLowerCase();
        return (
          shortcodes.find((shortcode: string) => shortcode.startsWith(lowerQuery)) ||
          tags.find((tag: string) => tag.startsWith(lowerQuery))
        );
      })
      .slice(0, 5) as EmojiItem[];
  },

  allowSpaces: false,

  render: () => {
    let component: ReactRenderer<EmojiListRef>;
    let editor: Editor;

    return {
      onStart: (props: SuggestionProps): void => {
        if (!props.clientRect) return;

        editor = props.editor;

        // Track active dropdown
        editor.storage.utility.activeDropbarExtensions.push(CORE_EXTENSIONS.EMOJI);

        component = new ReactRenderer(EmojiList, {
          props: {
            items: props.items,
            command: props.command,
            editor: props.editor,
            query: props.query,
          },
          editor: props.editor,
        });

        // Append to editor container
        const targetElement =
          (props.editor.options.element as HTMLElement) || props.editor.view.dom.parentElement || document.body;
        targetElement.appendChild(component.element);
      },

      onUpdate: (props: SuggestionProps): void => {
        if (!component) return;

        component.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          query: props.query,
        });
      },

      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (props.event.key === "Escape") {
          if (component) {
            component.destroy();
          }
          return true;
        }

        // Delegate to EmojiList
        return component?.ref?.onKeyDown(props) || false;
      },

      onExit: (): void => {
        // Remove from active dropdowns
        if (editor) {
          const { activeDropbarExtensions } = editor.storage.utility;
          const index = activeDropbarExtensions.indexOf(CORE_EXTENSIONS.EMOJI);
          if (index > -1) {
            activeDropbarExtensions.splice(index, 1);
          }
        }

        // Cleanup
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
