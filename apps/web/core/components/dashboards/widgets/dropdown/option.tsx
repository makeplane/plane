/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LockIcon } from "@plane/propel/icons";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
import { EProductSubscriptionEnum } from "@plane/types";
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

export const DashboardWidgetChartTypesDropdownOption = observer(function DashboardWidgetChartTypesDropdownOption(
  props: Props
) {
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
              <span className={cn("px-0.5 rounded bg-accent-primary text-accent-primary")}>
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
          "flex-shrink-0 relative size-14 grid place-items-center border-2 border-subtle-1 rounded-sm hover:bg-layer-1 transition-colors",
          {
            "border-accent-strong pointer-events-none": isSelected,
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
          className={cn("size-8 text-tertiary transition-colors", {
            "text-accent-primary": isSelected,
          })}
        />
        {isUpgradeNeeded && (
          <span className="absolute top-0.5 right-0.5 size-3.5 grid place-items-center rounded-sm bg-accent-primary text-accent-primary">
            <LockIcon className="size-3" />
          </span>
        )}
      </button>
    </Tooltip>
  );
});
