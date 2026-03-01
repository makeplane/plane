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

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Eye } from "lucide-react";
import { EditIcon, PlusIcon, DashboardIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EWidgetChartModels, EWidgetChartTypes, ICustomSearchSelectOption } from "@plane/types";
import { Button, getButtonStyling } from "@plane/propel/button";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// plane web components
import { useAppRouter } from "@/hooks/use-app-router";
import { DashboardQuickActions } from "@/components/dashboards/quick-actions";
import { DashboardWidgetChartTypesDropdown } from "@/components/dashboards/widgets/dropdown";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

export const WorkspaceDashboardDetailsHeader = observer(function WorkspaceDashboardDetailsHeader() {
  // refs
  const parentRef = useRef(null);
  // states
  const [isAddingWidget, setIsAddingWidget] = useState(false);
  // navigation
  const { workspaceSlug, dashboardId } = useParams();
  const router = useAppRouter();
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { currentWorkspaceDashboardIds },
  } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId?.toString() ?? "");
  const { canCurrentUserEditDashboard, isViewModeEnabled, toggleViewingMode, widgetsStore } = dashboardDetails ?? {};
  const { canCurrentUserCreateWidget, getNewWidgetPayload, createWidget, toggleEditWidget } = widgetsStore ?? {};
  // translation
  const { t } = useTranslation();

  const handleAddNewWidget = async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
    const payload = getNewWidgetPayload?.(chartType, chartModel);
    if (!payload) return;
    try {
      setIsAddingWidget(true);
      const res = await createWidget?.(payload);
      if (res?.id) {
        toggleEditWidget?.(res.id);
        const widgetElement = document.getElementById(`widget-${res.id}`);
        widgetElement?.scrollIntoView({ behavior: "smooth" });
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

  const switcherOptions = currentWorkspaceDashboardIds
    .map((id) => {
      const _dashboard = getDashboardById(id);
      if (!_dashboard?.id || !_dashboard?.name) return null;
      return {
        value: _dashboard.id,
        query: _dashboard.name,
        content: <SwitcherLabel name={_dashboard.name} LabelIcon={DashboardIcon} />,
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${workspaceSlug}/dashboards`}
                label={t("workspace_dashboards")}
                icon={<DashboardIcon className="size-4 text-tertiary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbNavigationSearchDropdown
                selectedItem={dashboardId.toString()}
                navigationItems={switcherOptions}
                onChange={(value: string) => {
                  router.push(`/${workspaceSlug}/dashboards/${value}`);
                }}
                title={dashboardDetails?.name}
                icon={
                  <Breadcrumbs.Icon>
                    <DashboardIcon className="size-4 flex-shrink-0 text-tertiary" />
                  </Breadcrumbs.Icon>
                }
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      {dashboardDetails && (
        <Header.RightItem className="items-center">
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
            />
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={() => toggleViewingMode?.()}
            prependIcon={isViewModeEnabled ? <EditIcon className="size-3.5" /> : <Eye className="size-3.5" />}
            disabled={!canCurrentUserEditDashboard}
          >
            {t(isViewModeEnabled ? "common.edit" : "common.view")}
          </Button>
          <DashboardQuickActions
            dashboardId={dashboardId.toString()}
            parentRef={parentRef}
            showEdit={false}
            customClassName="p-1 rounded-sm outline-none hover:bg-layer-1 bg-layer-1/70 size-[26px]"
          />
        </Header.RightItem>
      )}
    </Header>
  );
});
