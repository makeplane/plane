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
      Tab: () => {
        if (this.editor.commands.sinkListItem("listItem")) {
          return true;
        } else if (this.editor.commands.sinkListItem("taskItem")) {
          return true;
        }
        return true;
      },
      "Shift-Tab": () => {
        if (this.editor.commands.liftListItem("listItem")) {
          return true;
        } else if (this.editor.commands.liftListItem("taskItem")) {
          return true;
        }
        return true;
      },
      Delete: ({ editor }) => {
        try {
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
        } catch (e) {
          console.log("error in handling delete:", e);
          return false;
        }
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
        try {
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
        } catch (e) {
          console.log("error in handling Backspace:", e);
          return false;
        }
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
