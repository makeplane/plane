"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// component
import { PageHead } from "@/components/core";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web components
import { CustomerUpgrade, CustomerSettingsRoot } from "@/plane-web/components/customers";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// plane web constants
// plane web hooks
import { useCustomers, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const CustomerSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { workspaceInfoBySlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { updateWorkspaceFeature } = useWorkspaceFeatures();

  const { t } = useTranslation();

  // derived values
  const currentWorkspaceDetail = workspaceInfoBySlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Customers` : undefined;
  const isAdmin = currentWorkspaceDetail?.role === EUserWorkspaceRoles.ADMIN;
  const { isCustomersFeatureEnabled } = useCustomers();

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">{t("customers.settings.unauthorized")}</p>
        </div>
      </>
    );

  const toggleCustomersFeature = async () => {
    try {
      try {
        const payload = {
          [EWorkspaceFeatures.IS_CUSTOMERS_ENABLED]: !isCustomersFeatureEnabled,
        };
        const toggleCustomersFeaturePromise = updateWorkspaceFeature(workspaceSlug.toString(), payload);
        setPromiseToast(toggleCustomersFeaturePromise, {
          loading: isCustomersFeatureEnabled
            ? t("customers.settings.toasts.disable.loading")
            : t("customers.settings.toasts.enable.loading"),
          success: {
            title: isCustomersFeatureEnabled
              ? t("customers.settings.toasts.disable.success.title")
              : t("customers.settings.toasts.enable.success.title"),
            message: () =>
              isCustomersFeatureEnabled
                ? t("customers.settings.toasts.disable.success.message")
                : t("customers.settings.toasts.enable.success.message"),
          },
          error: {
            title: isCustomersFeatureEnabled
              ? t("customers.settings.toasts.disable.error.title")
              : t("customers.settings.toasts.enable.error.title"),
            message: () =>
              isCustomersFeatureEnabled
                ? t("customers.settings.toasts.disable.error.message")
                : t("customers.settings.toasts.enable.error.message"),
          },
        });
        await toggleCustomersFeaturePromise;
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <PageHead title={pageTitle} />
      <WithFeatureFlagHOC flag="CUSTOMERS" fallback={<CustomerUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
        <div className="flex items-center justify-between gap-2 border-b border-custom-border-200 pb-3">
          <div className="tracking-tight">
            <h3 className="text-xl font-medium">{t("project_settings.customers.settings_heading")}</h3>
            <span className="text-custom-sidebar-text-400 text-sm font-medium">
              {t("project_settings.customers.settings_sub_heading")}
            </span>
          </div>
          <div className={cn(isCustomersFeatureEnabled && "cursor-not-allowed")}>
            <ToggleSwitch value={!!isCustomersFeatureEnabled} onChange={toggleCustomersFeature} size="sm" />
          </div>
        </div>
        <CustomerSettingsRoot
          workspaceId={currentWorkspace?.id}
          toggleCustomersFeature={toggleCustomersFeature}
          isCustomersFeatureEnabled={!!isCustomersFeatureEnabled}
        />
      </WithFeatureFlagHOC>
    </>
  );
});

export default CustomerSettingsPage;
