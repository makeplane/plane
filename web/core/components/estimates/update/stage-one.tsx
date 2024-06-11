"use client";

import { FC } from "react";
import { Crown } from "lucide-react";
import { TEstimateUpdateStageKeys } from "@plane/types";
import { Tooltip } from "@plane/ui";
// constants
import { ESTIMATE_OPTIONS_STAGE_ONE } from "@/constants/estimates";
// helpers
import { cn } from "@/helpers/common.helper";

type TEstimateUpdateStageOne = {
  handleEstimateEditType?: (stage: TEstimateUpdateStageKeys) => void;
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
              "border border-custom-border-300 cursor-pointer space-y-1 p-3 rounded transition-colors",
              stage?.is_ee ? `bg-custom-background-90` : `hover:bg-custom-background-90`
            )}
            onClick={() => !stage?.is_ee && handleEstimateEditType && handleEstimateEditType(stage.key)}
          >
            <h3 className="text-base font-medium relative flex items-center gap-2">
              {stage.title}
              {stage?.is_ee && (
                <Tooltip tooltipContent={"upgrade"}>
                  <Crown size={12} className="text-amber-400" />
                </Tooltip>
              )}
            </h3>
            <p className="text-sm text-custom-text-200">{stage.description}</p>
          </div>
        ))}
    </div>
  );
};
