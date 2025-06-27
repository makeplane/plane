import type { EmojiOptions } from "@tiptap/extension-emoji";
import { ReactRenderer, Editor } from "@tiptap/react";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { EmojiItem, EmojiList, EmojiListRef, EmojiListProps } from "./components/emojis-list";

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
    let component: ReactRenderer<EmojiListRef, EmojiListProps>;
    let popup: TippyInstance[] | null = null;

    return {
      onStart: (props: SuggestionProps): void => {
        const emojiListProps: EmojiListProps = {
          items: props.items,
          command: props.command,
          editor: props.editor,
        };

        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeDropbarExtensions.push(CORE_EXTENSIONS.EMOJI);

        component = new ReactRenderer(EmojiList, {
          props: emojiListProps,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () =>
            document.querySelector(".active-editor") ??
            document.querySelector('[id^="editor-container"]') ??
            document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          hideOnClick: false,
          sticky: "reference",
          animation: false,
          duration: 0,
          offset: [0, 8],
        });
      },

      onUpdate: (props: SuggestionProps): void => {
        const emojiListProps: EmojiListProps = {
          items: props.items,
          command: props.command,
          editor: props.editor,
        };

        component.updateProps(emojiListProps);

        if (popup && props.clientRect) {
          popup[0]?.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        }
      },

      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (props.event.key === "Escape") {
          if (popup) {
            popup[0]?.hide();
          }
          if (component) {
            component.destroy();
          }
          return true;
        }

        return component.ref?.onKeyDown(props) || false;
      },

      onExit: (props: SuggestionProps): void => {
        const utilityStorage = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
        const index = utilityStorage.activeDropbarExtensions.indexOf(CORE_EXTENSIONS.EMOJI);
        if (index > -1) {
          utilityStorage.activeDropbarExtensions.splice(index, 1);
        }

        if (popup) {
          popup[0]?.destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};

export default emojiSuggestion;
