"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { setPromiseToast, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// component
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web imports
import { CustomerUpgrade, CustomerSettingsRoot } from "@/plane-web/components/customers";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { useCustomers, useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const CustomerSettingsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { updateWorkspaceFeature } = useWorkspaceFeatures();

  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug.toString());
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Customers` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const { isCustomersFeatureEnabled } = useCustomers();
  const isFeatureFlagEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.CUSTOMERS);

  if (!workspaceSlug || !currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

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
    <SettingsContentWrapper>
      <div className="w-full">
        <PageHead title={pageTitle} />{" "}
        <SettingsHeading
          title={t("project_settings.customers.settings_heading")}
          description={t("project_settings.customers.description")}
          appendToRight={
            <>
              {isFeatureFlagEnabled && (
                <div className={cn(isCustomersFeatureEnabled && "cursor-not-allowed")}>
                  <ToggleSwitch value={!!isCustomersFeatureEnabled} onChange={toggleCustomersFeature} size="sm" />
                </div>
              )}
            </>
          }
        />
        <WithFeatureFlagHOC flag="CUSTOMERS" fallback={<CustomerUpgrade />} workspaceSlug={workspaceSlug?.toString()}>
          <CustomerSettingsRoot
            workspaceId={currentWorkspace?.id}
            toggleCustomersFeature={toggleCustomersFeature}
            isCustomersFeatureEnabled={!!isCustomersFeatureEnabled}
          />
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default CustomerSettingsPage;
