import { Extension } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { updateFloatingUIFloaterPosition } from "@/helpers/floating-ui";
import type { CommandListInstance } from "@/helpers/tippy";
import { DROPDOWN_NAVIGATION_KEYS } from "@/helpers/tippy";
// types
import type { IEditorProps, ISlashCommandItem, TEditorCommands, TSlashCommandSectionKeys } from "@/types";
// components
import { getSlashCommandFilteredSections } from "./command-items-list";
import type { SlashCommandsMenuProps } from "./command-menu";
import { SlashCommandsMenu } from "./command-menu";

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
        command: ({ editor, range, props }) => {
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
          let cleanup: () => void = () => {};
          let editorRef: Editor | null = null;

          const handleClose = (editor?: Editor) => {
            component?.destroy();
            component = null;
            (editor || editorRef)?.commands.removeActiveDropbarExtension(CORE_EXTENSIONS.SLASH_COMMANDS);
            cleanup();
          };

          return {
            onStart: (props) => {
              editorRef = props.editor;
              // React renderer component, which wraps the actual dropdown component
              component = new ReactRenderer<CommandListInstance, SlashCommandsMenuProps>(SlashCommandsMenu, {
                props: {
                  ...props,
                  onClose: () => handleClose(props.editor),
                } satisfies SlashCommandsMenuProps,
                editor: props.editor,
                className: "fixed z-[100]",
              });
              if (!props.clientRect) return;
              props.editor.commands.addActiveDropbarExtension(CORE_EXTENSIONS.SLASH_COMMANDS);
              const element = component.element as HTMLElement;
              cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
            },

            onUpdate: (props) => {
              if (!component || !component.element) return;
              component.updateProps(props);
              if (!props.clientRect) return;
              const element = component.element as HTMLElement;
              cleanup();
              cleanup = updateFloatingUIFloaterPosition(props.editor, element).cleanup;
            },

            onKeyDown: ({ event }) => {
              if ([...DROPDOWN_NAVIGATION_KEYS, "Escape"].includes(event.key)) {
                event.preventDefault();
                event.stopPropagation();
              }

              if (event.key === "Escape") {
                handleClose(this.editor);
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
        ...this.options.suggestion,
      }),
    ];
  },
});

export type TExtensionProps = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions"> & {
  additionalOptions?: TSlashCommandAdditionalOption[];
};

export function SlashCommands(props: TExtensionProps) {
  return Command.configure({
    suggestion: {
      items: getSlashCommandFilteredSections(props),
    },
  });
}
