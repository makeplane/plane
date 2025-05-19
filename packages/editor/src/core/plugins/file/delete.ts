import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// plane editor types
import { ExtensionFileSetStorageKey } from "@/plane-editor/types/storage";
// types
import { TFileHandler } from "@/types";
// local imports
import { TFileNode } from "./types";

export const TrackFileDeletionPlugin = (
  editor: Editor,
  deleteHandler: TFileHandler["delete"],
  nodeType: string,
  fileSetName: ExtensionFileSetStorageKey
): Plugin =>
  new Plugin({
    key: new PluginKey(`delete-${nodeType}`),
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const newFileSources = new Set<string>();
      newState.doc.descendants((node) => {
        if (node.type.name === nodeType) {
          newFileSources.add(node.attrs.src);
        }
      });

      transactions.forEach((transaction) => {
        // if the transaction has meta of skipFileDeletion get to true, then return (like while clearing the editor content programatically)
        if (transaction.getMeta("skipFileDeletion")) return;
        // transaction could be a selection
        if (!transaction.docChanged) return;

        const removedFiles: TFileNode[] = [];

        // iterate through all the nodes in the old state
        oldState.doc.descendants((oldNode) => {
          // if the node doesn't match, then return as no point in checking
          if (oldNode.type.name !== nodeType) return;
          // Check if the node has been deleted or replaced
          if (!newFileSources.has(oldNode.attrs.src)) {
            removedFiles.push(oldNode as TFileNode);
          }
        });

        removedFiles.forEach(async (node) => {
          const src = node.attrs.src;
          editor.storage[nodeType][fileSetName]?.set(src, true);
          if (!src) return;
          try {
            await deleteHandler(src);
          } catch (error) {
            console.error("Error deleting file:", error);
          }
        });
      });

      return null;
    },
  });
