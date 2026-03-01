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
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Switch } from "@plane/propel/switch";
import { EUserWorkspaceRoles } from "@plane/types";
// component
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { CustomerUpgrade, CustomerSettingsRoot } from "@/components/customers";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { useCustomers, useFlag, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import type { Route } from "./+types/page";
import { CustomersWorkspaceSettingsHeader } from "./header";

function CustomerSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { updateWorkspaceFeature } = useWorkspaceFeatures();

  const { t } = useTranslation();

  // derived values
  const currentWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Customers` : undefined;
  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;
  const { isCustomersFeatureEnabled } = useCustomers();
  const isFeatureFlagEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.CUSTOMERS);

  if (!currentWorkspace?.id) return <></>;

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const toggleCustomersFeature = async () => {
    try {
      const payload = {
        [EWorkspaceFeatures.IS_CUSTOMERS_ENABLED]: !isCustomersFeatureEnabled,
      };
      const toggleCustomersFeaturePromise = updateWorkspaceFeature(workspaceSlug, payload);
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
  };

  return (
    <SettingsContentWrapper header={<CustomersWorkspaceSettingsHeader />}>
      <div className="w-full">
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("project_settings.customers.heading")}
          description={t("project_settings.customers.description")}
        />
        <div className="mt-6">
          <SettingsBoxedControlItem
            title="Enable customers"
            description="Link customer requests to work items and track progress by customer."
            control={
              isFeatureFlagEnabled && <Switch value={!!isCustomersFeatureEnabled} onChange={toggleCustomersFeature} />
            }
          />
        </div>
        <WithFeatureFlagHOC flag="CUSTOMERS" fallback={<CustomerUpgrade />} workspaceSlug={workspaceSlug}>
          <CustomerSettingsRoot
            workspaceId={currentWorkspace?.id}
            toggleCustomersFeature={toggleCustomersFeature}
            isCustomersFeatureEnabled={!!isCustomersFeatureEnabled}
          />
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(CustomerSettingsPage);
