"use client";

import { FC } from "react";
import { Crown, Info } from "lucide-react";
import { TEstimateSystemKeys } from "@plane/types";
import { Tooltip } from "@plane/ui";
// components
import { RadioInput } from "@/components/estimates";
// plane web constants
import { ESTIMATE_SYSTEMS } from "@/plane-web/constants/estimates";

type TEstimateCreateStageOne = {
  estimateSystem: TEstimateSystemKeys;
  handleEstimateSystem: (value: TEstimateSystemKeys) => void;
  handleEstimatePoints: (value: string) => void;
};

export const EstimateCreateStageOne: FC<TEstimateCreateStageOne> = (props) => {
  const { estimateSystem, handleEstimateSystem, handleEstimatePoints } = props;

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem] || undefined;

  if (!currentEstimateSystem) return <></>;
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:space-x-10 sm:space-y-0 gap-2 mb-2">
        <RadioInput
          options={Object.keys(ESTIMATE_SYSTEMS).map((system) => {
            const currentSystem = system as TEstimateSystemKeys;
            return {
              label: !ESTIMATE_SYSTEMS[currentSystem]?.is_available ? (
                <div className="relative flex items-center gap-2 cursor-no-drop text-custom-text-300">
                  {ESTIMATE_SYSTEMS[currentSystem]?.name}
                  <Tooltip tooltipContent={"Coming soon"}>
                    <Info size={12} />
                  </Tooltip>
                </div>
              ) : ESTIMATE_SYSTEMS[currentSystem]?.is_ee ? (
                <div className="relative flex items-center gap-2 cursor-no-drop text-custom-text-300">
                  {ESTIMATE_SYSTEMS[currentSystem]?.name}
                  <Tooltip tooltipContent={"upgrade"}>
                    <Crown size={12} className="text-amber-400" />
                  </Tooltip>
                </div>
              ) : (
                <div>{ESTIMATE_SYSTEMS[currentSystem]?.name}</div>
              ),
              value: system,
              disabled: !ESTIMATE_SYSTEMS[currentSystem]?.is_available || ESTIMATE_SYSTEMS[currentSystem]?.is_ee,
            };
          })}
          name="estimate-radio-input"
          label="Choose an estimate system"
          labelClassName="text-sm font-medium text-custom-text-200 mb-1.5"
          wrapperClassName="relative flex flex-wrap gap-14"
          fieldClassName="relative flex items-center gap-1.5"
          buttonClassName="size-4"
          selected={estimateSystem}
          onChange={(value) => handleEstimateSystem(value as TEstimateSystemKeys)}
        />
      </div>

      {ESTIMATE_SYSTEMS[estimateSystem]?.is_available && !ESTIMATE_SYSTEMS[estimateSystem]?.is_ee && (
        <>
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-custom-text-200">Start from scratch</div>
            <button
              className="border border-custom-border-200 rounded-md p-3 py-2.5 text-left space-y-1 w-full block hover:bg-custom-background-90"
              onClick={() => handleEstimatePoints("custom")}
            >
              <p className="text-base font-medium">Custom</p>
              <p className="text-xs text-custom-text-300">
                Add your own <span className="lowercase">{currentEstimateSystem.name}</span> from scratch
              </p>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-medium text-custom-text-200">Choose a template</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {Object.keys(currentEstimateSystem.templates).map((name) =>
                currentEstimateSystem.templates[name]?.hide ? null : (
                  <button
                    key={name}
                    className="border border-custom-border-200 rounded-md p-3 py-2.5 text-left space-y-1 hover:bg-custom-background-90"
                    onClick={() => handleEstimatePoints(name)}
                  >
                    <p className="text-base font-medium">{currentEstimateSystem.templates[name]?.title}</p>
                    <p className="text-xs text-custom-text-300">
                      {currentEstimateSystem.templates[name]?.values?.map((template) => template?.value)?.join(", ")}
                    </p>
                  </button>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

//
