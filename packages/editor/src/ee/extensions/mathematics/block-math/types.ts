import type { Node } from "@tiptap/core";
// parent types
import { TMathAttributes, TMathBaseCommandOptions } from "../types";

// BLOCK ATTRIBUTE TYPES
export type TBlockMathAttributes = TMathAttributes;

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

export type BlockMathExtensionType = Node<BlockMathOptions>;

// Base options for individual extensions (imported by specific extension type files)
export type BlockMathOptions = {
  isFlagged: boolean;
};
