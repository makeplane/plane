"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { Activity, Repeat } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EAutomationSidebarTab, ICustomSearchSelectOption } from "@plane/types";
import {
  BreadcrumbNavigationSearchDropdown,
  Breadcrumbs,
  Button,
  Header,
  setToast,
  TOAST_TYPE,
  Tooltip,
} from "@plane/ui";
// hooks
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SwitcherLabel } from "@/components/common/switcher-label";
import { useProject } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane-web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type TProps = {
  automationId: string;
  projectId: string;
};

export const ProjectAutomationDetailsHeader = observer((props: TProps) => {
  const { automationId, projectId } = props;
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
    projectAutomations: { currentProjectAutomationIds, getIsInitializingAutomations },
  } = useAutomations();
  // derived values
  const isInitializingAutomations = getIsInitializingAutomations(projectId);
  const automationDetails = getAutomationById(automationId);
  const { sidebarHelper } = automationDetails ?? {};
  if (!automationDetails) return null;
  const canEnableAutomation =
    !automationDetails.is_enabled && automationDetails.trigger && automationDetails.isAnyActionNodeAvailable;
  const switcherOptions = currentProjectAutomationIds
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
        console.error(err);
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
        <Breadcrumbs onBack={() => router.back()} isLoading={isInitializingProjects || isInitializingAutomations}>
          <CommonProjectBreadcrumbs
            workspaceSlug={automationDetails.workspaceSlug}
            projectId={automationDetails.project}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                href={`/${automationDetails.workspaceSlug}/settings/projects/${automationDetails.project}/automations`}
                label={t("automations.settings.title")}
                icon={<Repeat className="size-4 text-custom-text-300 hover:text-custom-text-100" />}
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
                    <Repeat className="size-4 flex-shrink-0 text-custom-text-300" />
                  </Breadcrumbs.Icon>
                }
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        {" "}
        <Button
          variant="neutral-primary"
          size="sm"
          onClick={handleOpenActivity}
          prependIcon={<Activity className="size-3 shrink-0" />}
        >
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
              size="sm"
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
      </Header.RightItem>
    </Header>
  );
});
