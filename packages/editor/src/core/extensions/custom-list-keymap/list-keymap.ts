import { Extension } from "@tiptap/core";
// extensions
import { handleBackspace, handleDelete } from "@/extensions/custom-list-keymap/list-helpers";

export type ListKeymapOptions = {
  listTypes: Array<{
    itemName: string;
    wrapperNames: string[];
  }>;
};

export const ListKeymap = ({ tabIndex }: { tabIndex?: number }) =>
  Extension.create<ListKeymapOptions>({
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
          if (this.editor.isActive("listItem") || this.editor.isActive("taskItem")) {
            if (this.editor.commands.sinkListItem("listItem")) {
              return true;
            } else if (this.editor.commands.sinkListItem("taskItem")) {
              return true;
            }
            return true;
          }
          // if tabIndex is set, we don't want to handle Tab key
          if (tabIndex !== undefined && tabIndex !== null) {
            return false;
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
            console.log("Error in handling Delete:", e);
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
            console.log("Error in handling Backspace:", e);
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
