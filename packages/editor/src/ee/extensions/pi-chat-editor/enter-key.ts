import { Extension } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

export const PiChatEditorEnterKeyExtension = (onEnterKeyPress?: () => void) =>
  Extension.create({
    name: "enterKey",

    addKeyboardShortcuts(this) {
      return {
        Enter: () => {
          if (!this.editor.storage.mentionsOpen) {
            onEnterKeyPress?.();
            return true;
          }
          return false;
        },
        "Shift-Enter": ({ editor }) =>
          editor.commands.first(({ commands }) => [
            () => commands.newlineInCode(),
            () => commands.splitListItem(CORE_EXTENSIONS.LIST_ITEM),
            () => commands.splitListItem(CORE_EXTENSIONS.TASK_ITEM),
            () => commands.createParagraphNear(),
            () => commands.liftEmptyBlock(),
            () => commands.splitBlock(),
          ]),
      };
    },
  });
