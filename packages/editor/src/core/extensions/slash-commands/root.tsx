import { computePosition, flip, shift } from "@floating-ui/dom";
import { Editor, Range, Extension } from "@tiptap/core";
import { ReactRenderer, posToDOMRect } from "@tiptap/react";
import Suggestion, { SuggestionOptions } from "@tiptap/suggestion";
import { FC } from "react";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { CommandListInstance } from "@/helpers/tippy";
// types
import { IEditorProps, ISlashCommandItem, TEditorCommands, TSlashCommandSectionKeys } from "@/types";
// components
import { getSlashCommandFilteredSections } from "./command-items-list";
import { SlashCommandsMenu, SlashCommandsMenuProps } from "./command-menu";

const updatePosition = (editor: Editor, element: HTMLElement) => {
  const virtualElement = {
    getBoundingClientRect: () => posToDOMRect(editor.view, editor.state.selection.from, editor.state.selection.to),
  };

  computePosition(virtualElement, element, {
    placement: "bottom-start",
    strategy: "absolute",
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    Object.assign(element.style, {
      width: "max-content",
      position: strategy,
      left: `${x}px`,
      top: `${y}px`,
    });
  });
};

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
              const MenuComponent = SlashCommandsMenu as unknown as FC<
                SlashCommandsMenuProps & { ref: React.Ref<CommandListInstance> }
              >;
              component = new ReactRenderer(MenuComponent, {
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

              updatePosition(props.editor, element);
            },

            onUpdate: (props) => {
              if (!component || !component.element) return;

              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              const element = component.element as HTMLElement;
              updatePosition(props.editor, element);
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
