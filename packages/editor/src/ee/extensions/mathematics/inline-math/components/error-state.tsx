import { SquareRadical } from "lucide-react";
import React from "react";
// types
import { TMathComponentProps } from "../../types";
// local components
import { InlineMathContainer } from "./container";

type TInlineMathErrorProps = TMathComponentProps & {
  errorMessage: string;
};

export const InlineMathErrorState: React.FC<TInlineMathErrorProps> = ({ errorMessage, onClick, isEditable }) => (
  <InlineMathContainer onClick={onClick} variant="error" title={errorMessage} isEditable={isEditable}>
    <SquareRadical className="size-4 shrink-0" />
    <span>Invalid equation</span>
  </InlineMathContainer>
);
