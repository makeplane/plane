import type { EmojiOptions } from "@tiptap/extension-emoji";
import { ReactRenderer, Editor } from "@tiptap/react";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// local imports
import { EmojiItem, EmojiList, EmojiListRef } from "./components/emojis-list";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

export const emojiSuggestion: EmojiOptions["suggestion"] = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    const { emojis } = getExtensionStorage(editor, CORE_EXTENSIONS.EMOJI);
    const { isSupported } = getExtensionStorage(editor, CORE_EXTENSIONS.EMOJI);
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
        filteredEmojis.find((emoji: EmojiItem) => emoji.shortcodes.includes(name) || emoji.name === name)
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
        getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY).activeDropbarExtensions.push(CORE_EXTENSIONS.EMOJI);

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
          const utilityStorage = getExtensionStorage(editor, CORE_EXTENSIONS.UTILITY);
          const index = utilityStorage.activeDropbarExtensions.indexOf(CORE_EXTENSIONS.EMOJI);
          if (index > -1) {
            utilityStorage.activeDropbarExtensions.splice(index, 1);
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
