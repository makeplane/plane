import { FC } from "react";
import { TEstimateSystemKeys } from "@plane/types";
// constants
import { RadioInput } from "@plane/ui";
import { ESTIMATE_SYSTEMS } from "@/constants/estimates";
// types

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
    <div className="space-y-7">
      <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0 gap-2 mb-2">
        <RadioInput
          options={Object.keys(ESTIMATE_SYSTEMS).map((system) => {
            const currentSystem = system as TEstimateSystemKeys;
            return {
              label: ESTIMATE_SYSTEMS[currentSystem]?.name || <div>Hello</div>,
              value: system,
              disabled: !ESTIMATE_SYSTEMS[currentSystem]?.is_available,
            };
          })}
          label="Choose an estimate system"
          labelClassName="text-sm font-medium text-custom-text-200 mb-3"
          wrapperClassName="relative flex flex-wrap gap-14"
          fieldClassName="relative flex items-center gap-2"
          buttonClassName="size-4"
          selected={estimateSystem}
          onChange={(value) => handleEstimateSystem(value as TEstimateSystemKeys)}
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-custom-text-200">Start from scratch</div>
        <button
          className="border border-custom-border-200 rounded-md p-3 py-2.5 text-left space-y-1 w-full block hover:bg-custom-background-90"
          onClick={() => handleEstimatePoints("custom")}
        >
          <p className="block text-base">Custom</p>
          <p className="text-xs text-gray-400">
            Add your own <span className="lowercase">{currentEstimateSystem.name}</span> from scratch
          </p>
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-custom-text-200">Choose a template</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {Object.keys(currentEstimateSystem.templates).map((name) =>
            currentEstimateSystem.templates[name]?.hide ? null : (
              <button
                key={name}
                className="border border-custom-border-200 rounded-md p-3 py-2.5 text-left space-y-1 hover:bg-custom-background-90"
                onClick={() => handleEstimatePoints(name)}
              >
                <p className="block text-base">{currentEstimateSystem.templates[name]?.title}</p>
                <p className="text-xs text-gray-400">
                  {currentEstimateSystem.templates[name]?.values?.map((template) => template?.value)?.join(", ")}
                </p>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
