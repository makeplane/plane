import { SquareRadical } from "lucide-react";
import React from "react";
// types
import { TMathComponentProps } from "../../types";
// local components
import { InlineMathContainer } from "./container";

type TInlineMathEmptyProps = TMathComponentProps;

export const InlineMathEmptyState: React.FC<TInlineMathEmptyProps> = ({ onClick, isEditable }) => (
  <InlineMathContainer onClick={onClick} variant="empty" title="Click to add equation" isEditable={isEditable}>
    <SquareRadical className="size-4 shrink-0" />
    <span>New equation</span>
  </InlineMathContainer>
);
