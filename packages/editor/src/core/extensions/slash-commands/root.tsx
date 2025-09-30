import { type Editor, type Range, Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
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

          return true;
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        render: () => {
          let component: ReactRenderer<CommandListInstance, SlashCommandsMenuProps> | null = null;

          return {
            onStart: (props) => {
              component = new ReactRenderer<CommandListInstance, SlashCommandsMenuProps>(SlashCommandsMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              const element = component.element as HTMLElement;
              element.style.position = "absolute";
              element.style.zIndex = "100";
              (props.editor.options.element || document.body).appendChild(element);

              updateFloatingUIFloaterPosition(props.editor, element);
            },

            onUpdate: (props) => {
              if (!component || !component.element) return;

              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              const element = component.element as HTMLElement;
              updateFloatingUIFloaterPosition(props.editor, element);
            },

            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                component?.destroy();
                component = null;
                return true;
              }

              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              component?.destroy();
              component = null;
            },
          };
        },
        ...this.options.suggestion,
      }),
    ];
  },
});

export type TExtensionProps = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions"> & {
  additionalOptions?: TSlashCommandAdditionalOption[];
};

export const SlashCommands = (props: TExtensionProps) =>
  Command.configure({
    suggestion: {
      items: getSlashCommandFilteredSections(props),
    },
  });
