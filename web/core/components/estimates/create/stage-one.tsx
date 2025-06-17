"use client";

import { FC } from "react";
import { Info } from "lucide-react";
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TEstimateSystemKeys } from "@plane/types";
import { Tooltip } from "@plane/ui";
// components
import { convertMinutesToHoursMinutesString } from "@plane/utils";
import { RadioInput } from "@/components/estimates";
// plane web constants
import { isEstimateSystemEnabled } from "@/plane-web/components/estimates/helper";
import { UpgradeBadge } from "@/plane-web/components/workspace";

type TEstimateCreateStageOne = {
  estimateSystem: TEstimateSystemKeys;
  handleEstimateSystem: (value: TEstimateSystemKeys) => void;
  handleEstimatePoints: (value: string) => void;
};

export const EstimateCreateStageOne: FC<TEstimateCreateStageOne> = (props) => {
  const { estimateSystem, handleEstimateSystem, handleEstimatePoints } = props;

  // i18n
  const { t } = useTranslation();

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem] || undefined;

  if (!currentEstimateSystem) return <></>;
  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:space-x-10 sm:space-y-0 gap-2 mb-2">
        <RadioInput
          options={Object.keys(ESTIMATE_SYSTEMS).map((system) => {
            const currentSystem = system as TEstimateSystemKeys;
            const isEnabled = isEstimateSystemEnabled(currentSystem);
            return {
              label: !ESTIMATE_SYSTEMS[currentSystem]?.is_available ? (
                <div className="relative flex items-center gap-2 cursor-no-drop text-custom-text-300">
                  {t(ESTIMATE_SYSTEMS[currentSystem]?.i18n_name)}
                  <Tooltip tooltipContent={t("common.coming_soon")}>
                    <Info size={12} />
                  </Tooltip>
                </div>
              ) : !isEnabled ? (
                <div className="relative flex items-center gap-2 cursor-no-drop text-custom-text-300">
                  {t(ESTIMATE_SYSTEMS[currentSystem]?.i18n_name)}
                  <UpgradeBadge />
                </div>
              ) : (
                <div>{t(ESTIMATE_SYSTEMS[currentSystem]?.i18n_name)}</div>
              ),
              value: system,
              disabled: !isEnabled,
            };
          })}
          name="estimate-radio-input"
          label={t("project_settings.estimates.create.choose_estimate_system")}
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
            <div className="text-sm font-medium text-custom-text-200">
              {t("project_settings.estimates.create.start_from_scratch")}
            </div>
            <button
              className="border border-custom-border-200 rounded-md p-3 py-2.5 text-left space-y-1 w-full block hover:bg-custom-background-90"
              onClick={() => handleEstimatePoints("custom")}
            >
              <p className="text-base font-medium">{t("project_settings.estimates.create.custom")}</p>
              <p className="text-xs text-custom-text-300">
                {/* TODO: Translate here */}
                Add your own <span className="lowercase">{currentEstimateSystem.name}</span> from scratch.
              </p>
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-sm font-medium text-custom-text-200">
              {t("project_settings.estimates.create.choose_template")}
            </div>
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
                      {currentEstimateSystem.templates[name]?.values
                        ?.map((template) =>
                          estimateSystem === EEstimateSystem.TIME
                            ? convertMinutesToHoursMinutesString(Number(template.value)).trim()
                            : template.value
                        )
                        ?.join(", ")}
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
