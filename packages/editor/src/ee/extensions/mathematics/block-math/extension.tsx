import { mergeAttributes, Node } from "@tiptap/core";
import { MarkdownSerializerState } from "@tiptap/pm/markdown";
import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { ReactNodeViewRenderer } from "@tiptap/react";
// plane constants
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// types
import { EMathAttributeNames } from "../types";
// utils
import { DEFAULT_MATH_ATTRIBUTES } from "../utils/math-attributes";
// commands
import { blockMathCommands } from "./commands";
// components
import { BlockMathNodeView, type BlockMathNodeViewProps } from "./components/node-view";
// input rules
import { blockMathInputRules } from "./input-rules";
// paste rules
import { blockMathPasteRules } from "./paste-rules";
// local types
import {
  TBlockMathSetCommandOptions,
  TBlockMathUnsetCommandOptions,
  TBlockMathUpdateCommandOptions,
  BlockMathExtensionType,
} from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.BLOCK_MATH]: {
      setBlockMath: (options: TBlockMathSetCommandOptions) => ReturnType;
      unsetBlockMath: (options?: TBlockMathUnsetCommandOptions) => ReturnType;
      updateBlockMath: (options?: TBlockMathUpdateCommandOptions) => ReturnType;
    };
  }
}

export const BlockMathExtension: BlockMathExtensionType = Node.create({
  name: ADDITIONAL_EXTENSIONS.BLOCK_MATH,

  group: "block",

  atom: true,

  selectable: true,

  addOptions() {
    return {
      isFlagged: false,
    };
  },

  addAttributes() {
    const attributes = {
      ...Object.values(EMathAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_MATH_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };
    return attributes;
  },

  addCommands() {
    return blockMathCommands(this.type);
  },

  parseHTML() {
    return [
      {
        tag: "block-math-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["block-math-component", mergeAttributes(HTMLAttributes)];
  },

  addInputRules() {
    return blockMathInputRules(this.type, this.options.isFlagged);
  },

  addPasteRules() {
    return blockMathPasteRules(this.type, this.options.isFlagged);
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <BlockMathNodeView {...props} node={props.node as BlockMathNodeViewProps["node"]} />
    ));
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          const latex = (node.attrs.latex || "").trim();
          state.write(`$$${latex}$$\n`);
        },
      },
    };
  },
});
