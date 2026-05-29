import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
// plane imports
import { CORE_EXTENSIONS } from "@plane/utils";
// helpers
import { CORE_ASSETS_META_DATA_RECORD } from "@/helpers/assets";
// plane editor imports
import { NODE_FILE_MAP } from "@/plane-editor/constants/utility";
// types
import type { TFileHandler } from "@/types";
// local imports
import type { NodeFileMapType } from "../../../ce/constants/utility";
import type { TFileNode } from "./types";

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
        const nodeType = node.type.name as keyof NodeFileMapType;
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
          const nodeType = node.type.name as keyof NodeFileMapType;
          const isAValidNode = NODE_FILE_MAP[nodeType];
          // if the node doesn't match, then return as no point in checking
          if (!isAValidNode) return;
          if (pos < 0 || pos > newState.doc.content.size) return;
          if (oldFileSources[nodeType]?.has(node.attrs.src)) return;
          // update assets list storage value
          const assetMetaData = CORE_ASSETS_META_DATA_RECORD[nodeType]?.(node.attrs);
          if (assetMetaData) {
            editor.commands.updateAssetsList?.({
              asset: assetMetaData,
            });
          }
          // if the src is just a id (private bucket), then we don't need to handle restore from here but
          // only while it fails to load
          if (nodeType === CORE_EXTENSIONS.CUSTOM_IMAGE && !node.attrs.src?.startsWith("http")) return;
          addedFiles.push(node as TFileNode);
        });

        addedFiles.forEach(async (node) => {
          const nodeType = node.type.name as keyof NodeFileMapType;
          const src = node.attrs.src;
          const nodeFileSetDetails = NODE_FILE_MAP[nodeType];
          if (!nodeFileSetDetails) return;
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
