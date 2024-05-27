import { FC } from "react";
import { TEstimateUpdateStageKeys } from "@plane/types";
// constants
import { ESTIMATE_OPTIONS_STAGE_ONE } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";

type TEstimateUpdateStageOne = {
  handleEstimateEditType: (stage: TEstimateUpdateStageKeys) => void;
};

export const EstimateUpdateStageOne: FC<TEstimateUpdateStageOne> = (props) => {
  const { handleEstimateEditType } = props;

  return (
    <div className="space-y-3">
      {ESTIMATE_OPTIONS_STAGE_ONE &&
        ESTIMATE_OPTIONS_STAGE_ONE.map((stage) => (
          <div
            key={stage.key}
            className={cn(
              "border border-custom-border-300 cursor-pointer space-y-1 p-3 rounded hover:bg-custom-background-90 transition-colors"
            )}
            onClick={() => handleEstimateEditType(stage.key)}
          >
            <h3 className="text-base font-medium">{stage.title}</h3>
            <p className="text-sm text-custom-text-200">{stage.description}</p>
          </div>
        ))}
    </div>
  );
};
