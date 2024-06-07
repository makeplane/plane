import { Extension } from "@tiptap/core";

export const EnterKeyExtension = (onEnterKeyPress?: () => void) =>
  Extension.create({
    name: "enterKey",

    addKeyboardShortcuts(this) {
      return {
        Enter: () => {
          if (!this.editor.storage.mentionsOpen) {
            if (onEnterKeyPress) {
              onEnterKeyPress();
            }
            return true;
          }
          return false;
        },
        "Shift-Enter": ({ editor }) =>
          editor.commands.first(({ commands }) => [
            () => commands.newlineInCode(),
            () => commands.splitListItem("listItem"),
            () => commands.createParagraphNear(),
            () => commands.liftEmptyBlock(),
            () => commands.splitBlock(),
          ]),
      };
    },
  });
