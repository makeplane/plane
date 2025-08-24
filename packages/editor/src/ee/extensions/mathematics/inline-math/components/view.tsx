import { FC } from "react";
// hooks
import { useMathRenderer } from "../../hooks/use-math-renderer";
// types
import { TMathComponentProps } from "../../types";
// local components
import { InlineMathContainer } from "./container";

type TInlineMathComponentProps = TMathComponentProps & {
  latex: string;
};

export const InlineMathView: FC<TInlineMathComponentProps> = ({ latex, onClick, isEditable }) => {
  const { mathRef } = useMathRenderer<HTMLSpanElement>(latex, { displayMode: false, throwOnError: false });

  return (
    <InlineMathContainer onClick={onClick} variant="content" isEditable={isEditable}>
      <span ref={mathRef} role="math" aria-label={`Inline math equation: ${latex}`} />
    </InlineMathContainer>
  );
};
