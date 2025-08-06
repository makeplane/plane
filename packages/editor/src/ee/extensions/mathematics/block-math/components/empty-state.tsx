import { Editor } from "@tiptap/core";
import { Sigma } from "lucide-react";
import React from "react";
// types
import { TMathComponentProps } from "../../types";
// local components
import { BlockMathContainer } from "./container";

type TBlockMathEmptyProps = TMathComponentProps & {
  selected?: boolean;
  editor?: Editor;
  isEditable?: boolean;
};

export const BlockMathEmptyState: React.FC<TBlockMathEmptyProps> = ({ onClick, selected, editor, isEditable }) => (
  <BlockMathContainer onClick={onClick} selected={selected} editor={editor} variant="empty" isEditable={isEditable}>
    <Sigma className="size-4 shrink-0" />
    <div className="text-base font-medium">Click to add equation</div>
  </BlockMathContainer>
);
