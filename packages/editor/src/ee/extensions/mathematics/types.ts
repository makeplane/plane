import type { Node, Editor } from "@tiptap/core";
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";

export enum EMathAttributeNames {
  LATEX = "latex",
  ID = "id",
}

// COMMON ATTRIBUTE TYPES
export type TMathAttributes = {
  [EMathAttributeNames.LATEX]: string;
  [EMathAttributeNames.ID]: string;
};

// COMMON COMMAND OPTION TYPES

export type TMathBaseCommandOptions = {
  latex: string;
  pos?: number;
};

// COMMON COMPONENT TYPES
export type TMathComponentProps = {
  onClick?: (event: React.MouseEvent) => void;
  isEditable?: boolean;
};

export type TMathNodeType = ADDITIONAL_EXTENSIONS.INLINE_MATH | ADDITIONAL_EXTENSIONS.BLOCK_MATH;

// MODAL COMPONENT TYPES
export type TMathModalBaseProps = {
  latex: string;
  onSave: (latex: string) => void;
  onClose: () => void;
  nodeType: TMathNodeType;
  editor: Editor;
  getPos: () => number | undefined;
};

// MAIN MATHEMATICS EXTENSION TYPES
export type MathematicsExtensionOptions = {
  isFlagged: boolean;
};

export type MathematicsExtensionStorage = {
  openMathModal: boolean;
};
export type MathNodeVariant = "empty" | "error" | "content";

export type MathematicsExtension = Node<MathematicsExtensionOptions, MathematicsExtensionStorage>;
