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
import { inlineMathCommands } from "./commands";
// components
import { InlineMathNodeView, type InlineMathNodeViewProps } from "./components/node-view";
// input rules
import { inlineMathInputRules } from "./input-rules";
// paste rules
import { inlineMathPasteRules } from "./paste-rules";
// types
import {
  TInlineMathSetCommandOptions,
  TInlineMathUnsetCommandOptions,
  TInlineMathUpdateCommandOptions,
  InlineMathExtensionType,
} from "./types";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    [ADDITIONAL_EXTENSIONS.INLINE_MATH]: {
      setInlineMath: (options: TInlineMathSetCommandOptions) => ReturnType;
      unsetInlineMath: (options?: TInlineMathUnsetCommandOptions) => ReturnType;
      updateInlineMath: (options?: TInlineMathUpdateCommandOptions) => ReturnType;
    };
  }
}

export const InlineMathExtension: InlineMathExtensionType = Node.create({
  name: ADDITIONAL_EXTENSIONS.INLINE_MATH,

  group: "inline",

  inline: true,

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
    return inlineMathCommands(this.type);
  },

  parseHTML() {
    return [
      {
        tag: "inline-math-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["inline-math-component", mergeAttributes(HTMLAttributes)];
  },

  addInputRules() {
    return inlineMathInputRules(this.type, this.options.isFlagged);
  },

  addPasteRules() {
    return inlineMathPasteRules(this.type, this.options.isFlagged);
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <InlineMathNodeView {...props} node={props.node as InlineMathNodeViewProps["node"]} />
    ));
  },

  addStorage() {
    return {
      markdown: {
        serialize: (state: MarkdownSerializerState, node: ProseMirrorNode) => {
          const latex = (node.attrs.latex || "").trim();
          state.write(`$${latex}$`);
        },
      },
    };
  },
});
