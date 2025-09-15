import React, { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Lock } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { EProductSubscriptionEnum, EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
import { getSubscriptionTextAndBackgroundColor } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// plane web hooks
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// local imports
import { WidgetChartTypeIcon } from "..";

type Props = {
  isSelected: boolean;
  model: {
    flags: E_FEATURE_FLAGS[];
    i18n_long_label: string;
    value: EWidgetChartModels;
  };
  onSelect: (chartModel: EWidgetChartModels) => void;
  widget: EWidgetChartTypes;
};

export const DashboardWidgetChartTypesDropdownOption: React.FC<Props> = observer((props) => {
  const { isSelected, model, onSelect, widget } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // translation
  const { t } = useTranslation();
  // feature flags
  const isDashboardsEnabled = useFlag(workspaceSlug?.toString() ?? "", E_FEATURE_FLAGS.DASHBOARDS);
  const isDashboardsAdvancedEnabled = useFlag(workspaceSlug?.toString() ?? "", E_FEATURE_FLAGS.DASHBOARDS_ADVANCED);
  const featureFlags: Partial<Record<E_FEATURE_FLAGS, boolean>> = useMemo(
    () => ({
      [E_FEATURE_FLAGS.DASHBOARDS]: isDashboardsEnabled,
      [E_FEATURE_FLAGS.DASHBOARDS_ADVANCED]: isDashboardsAdvancedEnabled,
    }),
    [isDashboardsEnabled, isDashboardsAdvancedEnabled]
  );

  const isUpgradeNeeded = model.flags.every((flag) => !featureFlags[flag]);

  return (
    <Tooltip
      tooltipContent={
        <span className="font-medium">
          {isUpgradeNeeded ? (
            <>
              Upgrade to{" "}
              <span
                className={cn(
                  "px-0.5 rounded",
                  getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.BUSINESS)
                )}
              >
                {getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}
              </span>{" "}
              to
              <br />
              unlock <span className="font-semibold">{t(model.i18n_long_label)}</span>.
            </>
          ) : (
            t(model.i18n_long_label)
          )}
        </span>
      }
    >
      <button
        type="button"
        className={cn(
          "flex-shrink-0 relative size-14 grid place-items-center border-2 border-custom-border-300 rounded hover:bg-custom-background-80 transition-colors",
          {
            "border-custom-primary-100 pointer-events-none": isSelected,
          }
        )}
        onClick={() => {
          if (isUpgradeNeeded) {
            togglePaidPlanModal(true);
          } else {
            onSelect(model.value);
          }
        }}
      >
        <WidgetChartTypeIcon
          chartModel={model.value}
          chartType={widget}
          className={cn("size-8 text-custom-text-300 transition-colors", {
            "text-custom-primary-100": isSelected,
          })}
        />
        {isUpgradeNeeded && (
          <span
            className={cn(
              "absolute top-0.5 right-0.5 size-3.5 grid place-items-center rounded-sm",
              getSubscriptionTextAndBackgroundColor(EProductSubscriptionEnum.BUSINESS)
            )}
          >
            <Lock className="size-3" />
          </span>
        )}
      </button>
    </Tooltip>
  );
});
