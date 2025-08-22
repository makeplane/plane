import type { Node } from "@tiptap/core";
// local imports
import type { MathematicsExtensionOptions, TMathBaseCommandOptions } from "../types";

// BLOCK COMMAND OPTION TYPES
export type TBlockMathSetCommandOptions = TMathBaseCommandOptions;

export type TBlockMathUnsetCommandOptions = {
  pos?: number;
};

export type TBlockMathUpdateCommandOptions = {
  latex?: string;
  pos?: number;
};

// BLOCK EXTENSION TYPE
export type BlockMathOptions = Pick<MathematicsExtensionOptions, "isFlagged" | "onClick">;

export type BlockMathExtensionType = Node<BlockMathOptions>;
