import { FC } from "react";
// plane imports
import { EEstimateSystem, TEstimateSystemKeys } from "@plane/types";
// plane web imports
import { EstimateTimeInput } from "@/plane-web/components/estimates/inputs";
// local imports
import { EstimateNumberInput } from "./number-input";
import { EstimateTextInput } from "./text-input";

type TEstimateInputRootProps = {
  estimateType: TEstimateSystemKeys;
  handleEstimateInputValue: (value: string) => void;
  value?: string;
};

export const EstimateInputRoot: FC<TEstimateInputRootProps> = (props) => {
  const { estimateType, handleEstimateInputValue, value } = props;

  switch (estimateType) {
    case EEstimateSystem.POINTS:
      return (
        <EstimateNumberInput
          value={value ? parseInt(value) : undefined}
          handleEstimateInputValue={handleEstimateInputValue}
        />
      );
    case EEstimateSystem.CATEGORIES:
      return <EstimateTextInput value={value} handleEstimateInputValue={handleEstimateInputValue} />;
    case EEstimateSystem.TIME:
      return (
        <EstimateTimeInput
          value={value ? parseInt(value) : undefined}
          handleEstimateInputValue={handleEstimateInputValue}
        />
      );
    default:
      return null;
  }
};
