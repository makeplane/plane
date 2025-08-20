import type { Node } from "@tiptap/core";
// local imports
import type { MathematicsExtensionOptions, TMathBaseCommandOptions } from "../types";

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
export type InlineMathOptions = Pick<MathematicsExtensionOptions, "isFlagged" | "onClick">;

export type InlineMathExtensionType = Node<InlineMathOptions>;
