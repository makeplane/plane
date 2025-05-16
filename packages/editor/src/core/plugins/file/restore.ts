import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// types
import { TFileHandler } from "@/types";
// local imports
import { TFileNode } from "./types";

export const TrackFileRestorationPlugin = (
  editor: Editor,
  restoreHandler: TFileHandler["restore"],
  nodeType: string,
  fileSetName: string
): Plugin =>
  new Plugin({
    key: new PluginKey(`restore-${nodeType}`),
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const oldFileSources = new Set<string>();
      oldState.doc.descendants((node) => {
        if (node.type.name === nodeType) {
          oldFileSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        if (!transaction.docChanged) return;

        const addedFiles: TFileNode[] = [];

        newState.doc.descendants((node, pos) => {
          if (node.type.name !== nodeType) return;
          if (pos < 0 || pos > newState.doc.content.size) return;
          if (oldFileSources.has(node.attrs.src)) return;
          // if the src is just a id (private bucket), then we don't need to handle restore from here but
          // only while it fails to load
          if (nodeType === "imageComponent" && !node.attrs.src?.startsWith("http")) return;
          addedFiles.push(node as TFileNode);
        });

        addedFiles.forEach(async (node) => {
          const src = node.attrs.src;
          const wasDeleted = editor.storage[nodeType][fileSetName].get(src);
          if (!src) return;
          if (wasDeleted === undefined) {
            editor.storage[nodeType][fileSetName].set(src, false);
          } else if (wasDeleted === true) {
            try {
              await restoreHandler(src);
              editor.storage[nodeType][fileSetName].set(src, false);
            } catch (error) {
              console.error("Error restoring file:", error);
            }
          }
        });
      });
      return null;
    },
  });
