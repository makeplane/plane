import { ReactRenderer } from "@tiptap/react";
import { Editor } from "@tiptap/react";
import tippy, { Instance as TippyInstance } from "tippy.js";
import { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { EmojiItem, EmojiList, EmojiListRef, EmojiListProps } from "./EmojiList";
import { CORE_EXTENSIONS } from "@/constants/extension";
import { getExtensionStorage } from "@/helpers/get-extension-storage";

const emojiSuggestion = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
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
    let popup: TippyInstance;

    return {
      onStart: (props: SuggestionProps): void => {
        const emojiListProps: EmojiListProps = {
          items: props.items,
          command: props.command,
          editor: props.editor,
        };

        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeModalExtensions.push(CORE_EXTENSIONS.EMOJI);
        console.log(
          getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeModalExtensions,
          "suggestion------ start"
        );
        component = new ReactRenderer(EmojiList, {
          props: emojiListProps,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy(document.body, {
          getReferenceClientRect: props.clientRect as () => DOMRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
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
          popup.setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          });
        }
      },

      onKeyDown: (props: SuggestionKeyDownProps): boolean => {
        if (props.event.key === "Escape") {
          if (popup) {
            popup.hide();
          }
          if (component) {
            component.destroy();
          }
          return true;
        }

        return component.ref?.onKeyDown(props) || false;
      },

      onExit: (props: any): void => {
        console.log("suggestion------ on exit");
        const { activeModalExtensions } = getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY);
        const newActiveModalExtensions = activeModalExtensions.filter(
          (extension) => extension !== CORE_EXTENSIONS.EMOJI
        );
        getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeModalExtensions = newActiveModalExtensions;
        console.log(
          getExtensionStorage(props.editor, CORE_EXTENSIONS.UTILITY).activeModalExtensions,
          "suggestion------ test"
        );

        if (popup) {
          popup.destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};

export default emojiSuggestion;
