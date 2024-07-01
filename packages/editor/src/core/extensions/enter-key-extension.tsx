import { Extension } from "@tiptap/core";

export const EnterKeyExtension = (onEnterKeyPress?: (descriptionHTML: string) => void) =>
  Extension.create({
    name: "enterKey",

    addKeyboardShortcuts(this) {
      return {
        Enter: () => {
          if (!this.editor.storage.mentionsOpen) {
            onEnterKeyPress?.(this.editor.getHTML());
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
