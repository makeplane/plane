import type { EmojiOptions } from "@tiptap/extension-emoji";
import { ReactRenderer, Editor } from "@tiptap/react";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";
// local imports
import { EmojiItem } from "./components/emojis-list";
import { FloatingEmojiList, FloatingEmojiListProps, FloatingEmojiListRef } from "./components/floating-emoji-list";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

const emojiSuggestion: EmojiOptions["suggestion"] = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    if (query.trim() === "") {
      const { emojis } = getExtensionStorage(editor, CORE_EXTENSIONS.EMOJI);
      const defaultEmojis = DEFAULT_EMOJIS.map((name) =>
        emojis.find((emoji: EmojiItem) => emoji.shortcodes.includes(name) || emoji.name === name)
      )
        .filter(Boolean)
        .slice(0, 5);
      return defaultEmojis as EmojiItem[];
    }
    return getExtensionStorage(editor, CORE_EXTENSIONS.EMOJI)
      .emojis.filter(({ shortcodes, tags }) => {
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
    let component: ReactRenderer<FloatingEmojiListRef, FloatingEmojiListProps>;
    let isOpen = false;

    return {
      onStart: (props: SuggestionProps): void => {
        if (!props.clientRect) return;

        isOpen = true;

        const floatingEmojiListProps: FloatingEmojiListProps = {
          items: props.items,
          command: props.command,
          editor: props.editor,
          isOpen,
          onOpenChange: (open: boolean) => {
            isOpen = open;
            if (!open) {
              // Handle close from floating UI
              const utilityStorage = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
              const index = utilityStorage.activeDropbarExtensions.indexOf(CORE_EXTENSIONS.EMOJI);
              if (index > -1) {
                utilityStorage.activeDropbarExtensions.splice(index, 1);
              }
            }
          },
        };

        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeDropbarExtensions.push(CORE_EXTENSIONS.EMOJI);

        component = new ReactRenderer(FloatingEmojiList, {
          props: floatingEmojiListProps,
          editor: props.editor,
        });

        // Append to the active editor or editor container
        const targetElement = (props.editor.options.element || document.body) as HTMLElement;

        targetElement.appendChild(component.element);
      },

      onUpdate: (props: SuggestionProps): void => {
        if (!component || !component.element) return;

        component.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          isOpen,
          onOpenChange: (open: boolean) => {
            isOpen = open;
          },
        });
      },

      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (props.event.key === "Escape") {
          isOpen = false;
          if (component) {
            component.destroy();
          }
          return true;
        }

        // Delegate keyboard events to the FloatingEmojiList component
        if (component && component.ref) {
          return component.ref.onKeyDown(props) || false;
        }

        return false;
      },

      onExit: (props: SuggestionProps): void => {
        const utilityStorage = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
        const index = utilityStorage.activeDropbarExtensions.indexOf(CORE_EXTENSIONS.EMOJI);
        if (index > -1) {
          utilityStorage.activeDropbarExtensions.splice(index, 1);
        }

        isOpen = false;
        if (component) {
          component.destroy();
        }
      },
    };
  },
};

export default emojiSuggestion;
