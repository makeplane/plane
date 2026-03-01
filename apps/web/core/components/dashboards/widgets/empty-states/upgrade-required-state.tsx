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

import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { EWidgetGridBreakpoints } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EProductSubscriptionEnum } from "@plane/types";
import { getSubscriptionName } from "@plane/utils";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
// plane web stores
import type { DashboardWidgetInstance } from "@/store/dashboards/widget";
import { CHART_ASSET_MAP } from "./helper";

type Props = {
  activeBreakpoint: EWidgetGridBreakpoints;
  widget: DashboardWidgetInstance;
};

export const DashboardWidgetUpgradeRequiredState = observer(function DashboardWidgetUpgradeRequiredState(props: Props) {
  const { activeBreakpoint, widget } = props;
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // theme hook
  const { resolvedTheme } = useTheme();
  // derived values
  const { chart_type, height } = widget ?? {};
  const shouldShowIcon = activeBreakpoint === EWidgetGridBreakpoints.XXS || height !== 1;
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const resolvedPath = chart_type ? CHART_ASSET_MAP[chart_type]?.[theme] : undefined;
  // translation
  const { t } = useTranslation();

  return (
    <div className="size-full grid place-items-center px-4 overflow-hidden">
      <div className="flex flex-col items-center gap-3">
        <SimpleEmptyState
          title={t("dashboards.widget.upgrade_required.title")}
          assetPath={shouldShowIcon ? resolvedPath : undefined}
        />
        <p className="text-13 text-placeholder text-center whitespace-pre-line">
          Upgrade to{" "}
          <button
            type="button"
            onClick={() => togglePaidPlanModal(true)}
            className="px-0.5 py-px rounded-sm outline-none bg-accent-primary text-accent-primary"
          >
            {getSubscriptionName(EProductSubscriptionEnum.BUSINESS)}
          </button>{" "}
          to use this widget type.
        </p>
      </div>
    </div>
  );
});
