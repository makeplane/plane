import { Extension } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// helpers
import { getExtensionStorage } from "@/helpers/get-extension-storage";

export const EnterKeyExtension = (onEnterKeyPress?: () => void) =>
  Extension.create({
    name: CORE_EXTENSIONS.ENTER_KEY,

    addKeyboardShortcuts(this) {
      return {
        Enter: () => {
          const isMentionOpen = getExtensionStorage(this.editor, CORE_EXTENSIONS.MENTION)?.mentionsOpen;
          if (!isMentionOpen) {
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
