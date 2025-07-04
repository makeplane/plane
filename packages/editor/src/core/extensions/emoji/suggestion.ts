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

export default emojiSuggestion;
