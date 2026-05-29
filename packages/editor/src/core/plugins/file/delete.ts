import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// plane editor imports
import { NODE_FILE_MAP } from "@/plane-editor/constants/utility";
// types
import type { TFileHandler } from "@/types";
// local imports
import type { NodeFileMapType } from "../../../ce/constants/utility";
import type { TFileNode } from "./types";

const DELETE_PLUGIN_KEY = new PluginKey("delete-utility");

export const TrackFileDeletionPlugin = (editor: Editor, deleteHandler: TFileHandler["delete"]): Plugin =>
  new Plugin({
    key: DELETE_PLUGIN_KEY,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      const newFileSources: {
        [nodeType: string]: Set<string> | undefined;
      } = {};
      if (!transactions.some((tr) => tr.docChanged)) return null;
      if (transactions.some((tr) => tr.getMeta(CORE_EDITOR_META.SKIP_FILE_DELETION))) return null;

      newState.doc.descendants((node) => {
        const nodeType = node.type.name as keyof NodeFileMapType;
        const nodeFileSetDetails = NODE_FILE_MAP[nodeType];
        if (nodeFileSetDetails) {
          if (newFileSources[nodeType]) {
            newFileSources[nodeType].add(node.attrs.src);
          } else {
            newFileSources[nodeType] = new Set([node.attrs.src]);
          }
        }
      });

      const removedFiles: TFileNode[] = [];

      // iterate through all the nodes in the old state
      oldState.doc.descendants((node) => {
        const nodeType = node.type.name as keyof NodeFileMapType;
        const isAValidNode = NODE_FILE_MAP[nodeType];
        // if the node doesn't match, then return as no point in checking
        if (!isAValidNode) return;
        // Check if the node has been deleted or replaced
        if (!newFileSources[nodeType]?.has(node.attrs.src)) {
          removedFiles.push(node as TFileNode);
        }
      });

      removedFiles.forEach(async (node) => {
        const nodeType = node.type.name as keyof NodeFileMapType;
        const src = node.attrs.src;
        const nodeFileSetDetails = NODE_FILE_MAP[nodeType];
        if (!nodeFileSetDetails || !src) return;
        try {
          editor.storage[nodeType]?.[nodeFileSetDetails.fileSetName]?.set(src, true);
          // update assets list storage value
          editor.commands.updateAssetsList?.({
            idToRemove: node.attrs.id,
          });
          await deleteHandler(src);
        } catch (error) {
          console.error("Error deleting file via delete utility plugin:", error);
        }
      });

      return null;
    },
  });
