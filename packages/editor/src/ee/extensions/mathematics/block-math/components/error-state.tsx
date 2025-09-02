import React from "react";
// types
import { TMathComponentProps } from "../../types";
// local components
import { BlockMathContainer } from "./container";

type TBlockMathErrorProps = TMathComponentProps & {
  errorMessage: string;
  isEditable?: boolean;
};

export const BlockMathErrorState: React.FC<TBlockMathErrorProps> = ({ errorMessage, onClick, isEditable }) => {
  const latexMessage = errorMessage.replace("KaTeX", "LaTeX");

  return (
    <BlockMathContainer onClick={onClick} variant="error" isEditable={isEditable}>
      <div className="block-equation-inner text-red-400 text-sm">{latexMessage}</div>
    </BlockMathContainer>
  );
};
