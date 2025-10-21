import type { EmojiOptions, EmojiStorage } from "@tiptap/extension-emoji";
import { ReactRenderer, type Editor } from "@tiptap/react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import { CommandListInstance, DROPDOWN_NAVIGATION_KEYS } from "@/helpers/tippy";
// local imports
import { type EmojiItem, EmojisListDropdown, EmojisListDropdownProps } from "./components/emojis-list";

const DEFAULT_EMOJIS = ["+1", "-1", "smile", "orange_heart", "eyes"];

export const emojiSuggestion: EmojiOptions["suggestion"] = {
  items: ({ editor, query }: { editor: Editor; query: string }): EmojiItem[] => {
    const { emojis, isSupported } = editor.storage.emoji as EmojiStorage;
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
    let component: ReactRenderer<CommandListInstance, EmojisListDropdownProps> | null = null;
    let cleanup: () => void = () => {};
    let editorRef: Editor | null = null;

    const handleClose = (editor?: Editor) => {
      component?.destroy();
      component = null;
      (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.EMOJI);
      cleanup();
    };

    return {
      onStart: (props) => {
        editorRef = props.editor;
        component = new ReactRenderer<CommandListInstance, EmojisListDropdownProps>(EmojisListDropdown, {
          props: {
            ...props,
            onClose: () => handleClose(props.editor),
          } satisfies EmojisListDropdownProps,
          editor: props.editor,
          className: "fixed z-[100]",
        });
        if (!props.clientRect) return;
        props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.EMOJI);
        const element = component.element as HTMLElement;
        cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
      },

      onUpdate: (props) => {
        if (!component || !component.element) return;
        component.updateProps(props);
        if (!props.clientRect) return;
        cleanup();
        cleanup = updateFloatingUIFloaterPosition(props.editor, component.element as HTMLElement).cleanup;
      },
      onKeyDown: ({ event }) => {
        if ([...DROPDOWN_NAVIGATION_KEYS, "Escape"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
        }

        if (event.key === "Escape") {
          handleClose();
          return true;
        }

        return component?.ref?.onKeyDown({ event }) ?? false;
      },

      onExit: ({ editor }) => {
        component?.element.remove();
        handleClose(editor);
      },
    };
  },
};
