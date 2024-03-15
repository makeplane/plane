import { Extension } from "@tiptap/core";

import { handleBackspace, handleDelete } from "src/ui/extensions/custom-list-keymap/list-helpers";

export type ListKeymapOptions = {
  listTypes: Array<{
    itemName: string;
    wrapperNames: string[];
  }>;
};

export const ListKeymap = Extension.create<ListKeymapOptions>({
  name: "listKeymap",

  addOptions() {
    return {
      listTypes: [
        {
          itemName: "listItem",
          wrapperNames: ["bulletList", "orderedList"],
        },
        {
          itemName: "taskItem",
          wrapperNames: ["taskList"],
        },
      ],
    };
  },

  addKeyboardShortcuts() {
    return {
      Delete: ({ editor }) => {
        let handled = false;

        this.options.listTypes.forEach(({ itemName }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return;
          }

          if (handleDelete(editor, itemName)) {
            handled = true;
          }
        });

        return handled;
      },
      "Mod-Delete": ({ editor }) => {
        let handled = false;

        this.options.listTypes.forEach(({ itemName }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return;
          }

          if (handleDelete(editor, itemName)) {
            handled = true;
          }
        });

        return handled;
      },
      Backspace: ({ editor }) => {
        let handled = false;

        this.options.listTypes.forEach(({ itemName, wrapperNames }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return;
          }

          if (handleBackspace(editor, itemName, wrapperNames)) {
            handled = true;
          }
        });

        return handled;
      },
      "Mod-Backspace": ({ editor }) => {
        let handled = false;

        this.options.listTypes.forEach(({ itemName, wrapperNames }) => {
          if (editor.state.schema.nodes[itemName] === undefined) {
            return;
          }

          if (handleBackspace(editor, itemName, wrapperNames)) {
            handled = true;
          }
        });

        return handled;
      },
    };
  },
});
