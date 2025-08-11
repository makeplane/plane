import type { Node } from "@tiptap/core";
import { TMathAttributes, TMathBaseCommandOptions } from "../types";

// INLINE ATTRIBUTE TYPES
export type TInlineMathAttributes = TMathAttributes;

// INLINE COMMAND OPTION TYPES
export type TInlineMathSetCommandOptions = TMathBaseCommandOptions;

export type TInlineMathUnsetCommandOptions = {
  pos?: number;
};

export type TInlineMathUpdateCommandOptions = {
  latex?: string;
  pos?: number;
  removeIfEmpty?: boolean;
};

// INLINE EXTENSION TYPE
export type InlineMathExtensionType = Node<InlineMathOptions>;

export type InlineMathOptions = {
  isFlagged: boolean;
};
