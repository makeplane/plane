import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { EmojiItem, EmojiList, EmojiListRef, EmojiListProps } from "./emoji-list";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { getExtensionStorage } from "@/helpers/get-extension-storage";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

const emojiSuggestion = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    if (query.trim() === "") {
      const defaultEmojis = DEFAULT_EMOJIS
        .map((name) =>
          editor.storage.emoji.emojis.find((emoji: EmojiItem) =>
            emoji.shortcodes.includes(name) || emoji.name === name
          )
        )
        .filter(Boolean) 
        .slice(0, 5);
      
      return defaultEmojis;
    }
    
    return editor.storage.emoji.emojis
      .filter(({ shortcodes, tags }: EmojiItem) => {
        return (
          shortcodes.find((shortcode: string) => shortcode.startsWith(query.toLowerCase())) ||
          tags.find((tag: string) => tag.startsWith(query.toLowerCase()))
        );
      })
      .slice(0, 5);
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

      onExit: (props: any): void => {
        const { activeDropbarExtensions } = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
        const newactiveDropbarExtensions = activeDropbarExtensions.filter(
          (extension) => extension !== CORE_EXTENSIONS.EMOJI
        );
        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeDropbarExtensions = newactiveDropbarExtensions;

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
