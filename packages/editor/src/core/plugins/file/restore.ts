import { Editor } from "@tiptap/core";
import { EditorState, Plugin, PluginKey, Transaction } from "@tiptap/pm/state";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// plane editor imports
import { NODE_FILE_MAP } from "@/plane-editor/constants/utility";
// types
import { TFileHandler } from "@/types";
// local imports
import { TFileNode } from "./types";

const RESTORE_PLUGIN_KEY = new PluginKey("restore-utility");

export const TrackFileRestorationPlugin = (editor: Editor, restoreHandler: TFileHandler["restore"]): Plugin =>
  new Plugin({
    key: RESTORE_PLUGIN_KEY,
    appendTransaction: (transactions: readonly Transaction[], oldState: EditorState, newState: EditorState) => {
      if (!transactions.some((tr) => tr.docChanged)) return null;

      const oldFileSources: {
        [key: string]: Set<string> | undefined;
      } = {};
      oldState.doc.descendants((node) => {
        const nodeType = node.type.name;
        const nodeFileSetDetails = NODE_FILE_MAP[nodeType];
        if (nodeFileSetDetails) {
          if (oldFileSources[nodeType]) {
            oldFileSources[nodeType].add(node.attrs.src);
          } else {
            oldFileSources[nodeType] = new Set([node.attrs.src]);
          }
        }
      });

      transactions.forEach(() => {
        const addedFiles: TFileNode[] = [];

        newState.doc.descendants((node, pos) => {
          const nodeType = node.type.name;
          const isAValidNode = NODE_FILE_MAP[nodeType];
          // if the node doesn't match, then return as no point in checking
          if (!isAValidNode) return;
          if (pos < 0 || pos > newState.doc.content.size) return;
          if (oldFileSources[nodeType]?.has(node.attrs.src)) return;
          // if the src is just a id (private bucket), then we don't need to handle restore from here but
          // only while it fails to load
          if (nodeType === CORE_EXTENSIONS.CUSTOM_IMAGE && !node.attrs.src?.startsWith("http")) return;
          addedFiles.push(node as TFileNode);
        });

        addedFiles.forEach(async (node) => {
          const nodeType = node.type.name;
          const src = node.attrs.src;
          const nodeFileSetDetails = NODE_FILE_MAP[nodeType];
          const extensionFileSetStorage = editor.storage[nodeType]?.[nodeFileSetDetails.fileSetName];
          const wasDeleted = extensionFileSetStorage?.get(src);
          if (!nodeFileSetDetails || !src) return;
          if (wasDeleted === undefined) {
            extensionFileSetStorage?.set(src, false);
          } else if (wasDeleted === true) {
            try {
              await restoreHandler(src);
              extensionFileSetStorage?.set(src, false);
            } catch (error) {
              console.error("Error restoring file via restore utility plugin:", error);
            }
          }
        });
      });
      return null;
    },
  });
