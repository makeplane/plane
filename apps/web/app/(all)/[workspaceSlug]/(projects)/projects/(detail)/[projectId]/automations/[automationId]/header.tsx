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
// plane imports
import { Activity, Repeat } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ICustomSearchSelectOption } from "@plane/types";
import { EAutomationSidebarTab } from "@plane/types";
import { Button } from "@plane/propel/button";
import { BreadcrumbNavigationSearchDropdown, Breadcrumbs, Header, Tooltip } from "@plane/ui";
// hooks
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
// helpers
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { AutomationQuickActions } from "@/components/automations/details/quick-actions";
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
  projectId: string;
  workspaceSlug: string;
};

export const ProjectAutomationDetailsHeader = observer(function ProjectAutomationDetailsHeader(props: TProps) {
  const { automationId, projectId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { isInitializingProjects } = useProject();
  const {
    getAutomationById,
    projectAutomations: { getProjectAutomationIds, deleteAutomation },
  } = useAutomations();
  // derived values
  const automationDetails = getAutomationById(automationId);
  const { sidebarHelper } = automationDetails ?? {};
  if (!automationDetails) return null;
  const canEnableAutomation =
    !automationDetails.is_enabled && automationDetails.trigger && automationDetails.isAnyActionNodeAvailable;
  const switcherOptions = getProjectAutomationIds(projectId)
    ?.map((id) => {
      const automation = id === automationId ? automationDetails : getAutomationById(id);
      if (!automation) return;
      return {
        value: automation.id,
        query: automation.name,
        content: <SwitcherLabel name={automation.name} LabelIcon={Repeat} />,
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  const handleEnableAutomation = async () => {
    await automationDetails
      .enable()
      .then(() => {
        setToast({
          title: t("automations.toasts.enable.success.title"),
          message: t("automations.toasts.enable.success.message"),
          type: TOAST_TYPE.SUCCESS,
        });
      })
      .catch((err) => {
        setToast({
          title: t("automations.toasts.enable.error.title"),
          message: t("automations.toasts.enable.error.message"),
          type: TOAST_TYPE.ERROR,
        });
      });
  };

  const handleDisableAutomation = async () => {
    await automationDetails
      .disable()
      .then(() => {
        setToast({
          title: t("automations.toasts.disable.success.title"),
          message: t("automations.toasts.disable.success.message"),
          type: TOAST_TYPE.SUCCESS,
        });
      })
      .catch((err) => {
        console.error(err);
        setToast({
          title: t("automations.toasts.disable.error.title"),
          message: t("automations.toasts.disable.error.message"),
          type: TOAST_TYPE.ERROR,
        });
      });
  };

  const handleAutomationStatusChange = async () => {
    setIsUpdatingStatus(true);
    await (automationDetails.is_enabled ? handleDisableAutomation : handleEnableAutomation)();
    setIsUpdatingStatus(false);
  };

  const handleOpenActivity = () => {
    sidebarHelper?.setSelectedSidebarConfig({
      tab: EAutomationSidebarTab.ACTIVITY,
      mode: "view",
    });
  };

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={() => router.back()} isLoading={isInitializingProjects || !automationDetails}>
          <ProjectBreadcrumbWithPreference
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={automationDetails.settingsLink}
                label={t("automations.settings.title")}
                icon={<Repeat className="size-3 text-tertiary hover:text-primary" />}
              />
            }
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbNavigationSearchDropdown
                selectedItem={automationId}
                navigationItems={switcherOptions}
                onChange={(value: string) => {
                  const automation = getAutomationById(value);
                  if (!automation || !automation.redirectionLink) return;
                  router.push(automation.redirectionLink);
                }}
                title={automationDetails?.name}
                icon={
                  <Breadcrumbs.Icon>
                    <Repeat className="size-4 flex-shrink-0 text-tertiary" />
                  </Breadcrumbs.Icon>
                }
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem className="items-center">
        <Button variant="secondary" onClick={handleOpenActivity} prependIcon={<Activity className="size-3 shrink-0" />}>
          {t("common.activity")}
        </Button>
        <Tooltip
          tooltipContent={
            !automationDetails.is_enabled && !canEnableAutomation ? t("automations.enable.validation.required") : ""
          }
          position="bottom"
          disabled={automationDetails.is_enabled || canEnableAutomation}
        >
          <span>
            <Button
              variant="primary"
              onClick={handleAutomationStatusChange}
              loading={isUpdatingStatus}
              disabled={isUpdatingStatus || (!automationDetails.is_enabled ? !canEnableAutomation : false)}
            >
              {automationDetails.is_enabled
                ? isUpdatingStatus
                  ? t("common.disabling")
                  : t("common.actions.disable")
                : isUpdatingStatus
                  ? t("common.enabling")
                  : t("common.actions.enable")}
            </Button>
          </span>
        </Tooltip>
        <AutomationQuickActions
          automationId={automationId}
          deleteAutomation={deleteAutomation.bind(deleteAutomation, workspaceSlug, projectId)}
        />
      </Header.RightItem>
    </Header>
  );
});
