import { Editor, Range, Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import tippy, { Instance } from "tippy.js";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { CommandListInstance } from "@/helpers/tippy";
// types
import { IEditorProps, ISlashCommandItem, TEditorCommands, TSlashCommandSectionKeys } from "@/types";
// components
import { getSlashCommandFilteredSections } from "./command-items-list";
import { SlashCommandsMenu, SlashCommandsMenuProps } from "./command-menu";

export type SlashCommandOptions = {
  suggestion: Omit<SuggestionOptions, "editor">;
};

export type TSlashCommandAdditionalOption = ISlashCommandItem & {
  section: TSlashCommandSectionKeys;
  pushAfter: TEditorCommands;
};

const Command = Extension.create<SlashCommandOptions>({
  name: CORE_EXTENSIONS.SLASH_COMMANDS,
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: any }) => {
          props.command({ editor, range });
        },
        allow({ editor }: { editor: Editor }) {
          const { selection } = editor.state;

          const parentNode = selection.$from.node(selection.$from.depth);
          const blockType = parentNode.type.name;

          if (blockType === CORE_EXTENSIONS.CODE_BLOCK) {
            return false;
          }

          if (editor.isActive(CORE_EXTENSIONS.TABLE)) {
            return false;
          }

          return true;
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

const renderItems = () => {
  let component: ReactRenderer<CommandListInstance, SlashCommandsMenuProps> | null = null;
  let popup: Instance | null = null;
  return {
    onStart: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component = new ReactRenderer<CommandListInstance, SlashCommandsMenuProps>(SlashCommandsMenu, {
        props,
        editor: props.editor,
      });

      const tippyContainer =
        document.querySelector(".active-editor") ?? document.querySelector('[id^="editor-container"]');
      // @ts-expect-error - Tippy types are incorrect
      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: tippyContainer,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: { editor: Editor; clientRect?: (() => DOMRect | null) | null }) => {
      component?.updateProps(props);

      popup?.[0]?.setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }
      if (component?.ref?.onKeyDown(props)) {
        return true;
      }
      return false;
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export type TExtensionProps = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions"> & {
  additionalOptions?: TSlashCommandAdditionalOption[];
};

export const SlashCommands = (props: TExtensionProps) =>
  Command.configure({
    suggestion: {
      items: getSlashCommandFilteredSections(props),
      render: renderItems,
    },
  });
