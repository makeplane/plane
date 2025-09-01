import { RawCommands } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
import { v4 as uuidv4 } from "uuid";
// plane imports
import { getExtensionStorage } from "@/helpers/get-extension-storage";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EMathAttributeNames } from "../types";
import { TBlockMathSetCommandOptions, TBlockMathUnsetCommandOptions, TBlockMathUpdateCommandOptions } from "./types";

export const blockMathCommands = (nodeType: NodeType): Partial<RawCommands> => ({
  setBlockMath:
    (options: TBlockMathSetCommandOptions) =>
    ({ commands, editor }) => {
      const { latex, pos } = options;

      const mathStorage = getExtensionStorage(editor, ADDITIONAL_EXTENSIONS.MATHEMATICS);
      if (mathStorage) {
        mathStorage.openMathModal = true;
      }

      return commands.insertContentAt(pos ?? editor.state.selection.from, {
        type: nodeType.name,
        attrs: { latex, [EMathAttributeNames.ID]: uuidv4() },
      });
    },

  unsetBlockMath:
    (options?: TBlockMathUnsetCommandOptions) =>
    ({ editor, tr }) => {
      const pos = options?.pos ?? editor.state.selection.$from.pos;
      const node = editor.state.doc.nodeAt(pos);

      if (!node || node.type.name !== nodeType.name) {
        return false;
      }

      tr.delete(pos, pos + node.nodeSize);
      return true;
    },

  updateBlockMath:
    (options?: TBlockMathUpdateCommandOptions) =>
    ({ editor, tr }) => {
      const { latex } = options || {};
      let pos = options?.pos;

      if (pos === undefined) {
        pos = editor.state.selection.$from.pos;
      }

      const node = editor.state.doc.nodeAt(pos);

      if (!node || node.type.name !== nodeType.name) {
        return false;
      }

      tr.setNodeMarkup(pos, nodeType, {
        ...node.attrs, // Preserve all existing attributes
        latex: latex !== undefined ? latex : node.attrs.latex, // Only update latex
      });

      return true;
    },
});
