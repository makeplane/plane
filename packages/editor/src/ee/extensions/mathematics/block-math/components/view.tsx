import { FC } from "react";
// hooks
import { useMathRenderer } from "../../hooks/use-math-renderer";
// types
import { TMathComponentProps } from "../../types";
// local components
import { BlockMathContainer } from "./container";

type TBlockMathComponentProps = TMathComponentProps & {
  latex: string;
  isEditable?: boolean;
};

export const BlockMathView: FC<TBlockMathComponentProps> = ({ latex, onClick, isEditable }) => {
  const { mathRef } = useMathRenderer<HTMLDivElement>(latex, { displayMode: true, throwOnError: false });

  return (
    <BlockMathContainer onClick={onClick} variant="content" isEditable={isEditable}>
      <div
        ref={mathRef}
        className="block-equation-inner max-h-full overflow-x-auto overflow-y-hidden text-center horizontal-scrollbar scrollbar-xs"
        role="math"
        aria-label={`Block math equation: ${latex}`}
      />
    </BlockMathContainer>
  );
};
