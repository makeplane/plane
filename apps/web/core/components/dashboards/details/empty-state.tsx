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

import { useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { PlusIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
// assets
import widgetsListDark from "@/app/assets/empty-state/dashboards/widgets/list-dark.webp?url";
import widgetsListLight from "@/app/assets/empty-state/dashboards/widgets/list-light.webp?url";
// components
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// hooks
import { useDashboards } from "@/plane-web/hooks/store";
import { DashboardWidgetChartTypesDropdown } from "../widgets/dropdown";

type Props = {
  dashboardId: string;
};

export const DashboardsWidgetsListEmptyState = observer(function DashboardsWidgetsListEmptyState(props: Props) {
  const { dashboardId } = props;
  // states
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  // store hooks
  const { getDashboardById } = useDashboards();
  // theme hook
  const { resolvedTheme } = useTheme();
  // derived values
  const { isViewModeEnabled, widgetsStore } = getDashboardById(dashboardId) ?? {};
  const { canCurrentUserCreateWidget, createWidget, getNewWidgetPayload, toggleEditWidget } = widgetsStore ?? {};
  // translation
  const { t } = useTranslation();
  // empty state asset path
  const widgetsAssetResolvedPath = resolvedTheme === "light" ? widgetsListLight : widgetsListDark;

  const handleAddNewWidget = async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
    const payload = getNewWidgetPayload?.(chartType, chartModel);
    if (!payload) return;
    try {
      setIsAddingWidget(true);
      const res = await createWidget?.(payload);
      if (res?.id) {
        toggleEditWidget?.(res.id);
      }
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to add widget. Please try again.",
      });
    } finally {
      setIsAddingWidget(false);
    }
  };

  return (
    <div className="size-full grid place-items-center px-page-x">
      <div className="flex flex-col items-center gap-5">
        <SimpleEmptyState
          title={t("dashboards.empty_state.widgets_list.title")}
          description={t("dashboards.empty_state.widgets_list.description")}
          assetPath={widgetsAssetResolvedPath}
          size="lg"
        />
        {!isViewModeEnabled && canCurrentUserCreateWidget && (
          <DashboardWidgetChartTypesDropdown
            buttonClassName={getButtonStyling("secondary", "base")}
            buttonContent={
              <>
                {!isAddingWidget && <PlusIcon className="flex-shrink-0 size-3.5" />}
                {t(isAddingWidget ? "common.adding" : "dashboards.widget.common.add_widget")}
              </>
            }
            disabled={isAddingWidget}
            onSelect={(val) => handleAddNewWidget(val.chartType, val.chartModel)}
            placement="auto"
          />
        )}
      </div>
    </div>
  );
});
