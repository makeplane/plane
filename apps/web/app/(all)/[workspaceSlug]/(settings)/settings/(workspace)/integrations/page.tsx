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
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
// constants
import { APPLICATIONS_LIST } from "@/constants/fetch-keys";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { AppListRoot } from "@/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";
import { SiloAppService } from "@/services/integrations/silo.service";
import { useState } from "react";
import { cn } from "@plane/utils";
import { ConnectorListRoot } from "@/components/marketplace/connectors/root";
import { useRouter, useSearchParams } from "next/navigation";
import { WithAiFeatureFlagHOC } from "@/components/feature-flags/with-ai-feature-flag-hoc";

const siloAppService = new SiloAppService();

function WorkspaceIntegrationsPage() {
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { slug: workspaceSlug } = currentWorkspace || {};
  const { fetchApplications, getApplicationsForWorkspace } = useApplications();
  const searchParams = useSearchParams();
  const router = useRouter();

  // derived values
  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;
  const applications = getApplicationsForWorkspace(workspaceSlug || "");
  const activeTabParam = searchParams.get("tab");

  // state
  const [activeTab, setActiveTab] = useState<"apps" | "connectors">(
    activeTabParam === "connectors" ? "connectors" : "apps"
  );

  const { data, isLoading } = useSWR(
    workspaceSlug ? APPLICATIONS_LIST(workspaceSlug) : null,
    workspaceSlug ? async () => fetchApplications() : null
  );

  const { data: supportedIntegrations, isLoading: supportedIntegrationsLoading } = useSWR(
    `SILO_SUPPORTED_INTEGRATIONS`,
    () => siloAppService.getSupportedIntegrations(),
    {
      revalidateOnFocus: false,
    }
  );

  const areIntegrationsLoading =
    !data || isLoading || !applications || !supportedIntegrations || supportedIntegrationsLoading;
  const isUnauthorized = workspaceUserInfo && !canPerformWorkspaceMemberActions;

  if (areIntegrationsLoading) {
    return <EmailSettingsLoader />;
  }

  if (isUnauthorized) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const handleTabChange = (tab: "apps" | "connectors") => {
    setActiveTab(tab);
    router.push(`/${workspaceSlug}/settings/integrations?tab=${tab}`);
  };
  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full space-y-6">
        <SettingsHeading
          title={t("workspace_settings.settings.integrations.title")}
          description={t("workspace_settings.settings.integrations.page_description")}
        />
        <>
          {/* Tab Navigation */}
          <div className="flex items-center gap-3 border-b border-subtle">
            <button
              onClick={() => handleTabChange("apps")}
              className={cn(
                "py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === "apps"
                  ? "border-primary-dark text-primary"
                  : "border-transparent text-tertiary hover:text-secondary"
              )}
            >
              <Button variant={activeTab === "apps" ? "tertiary" : "ghost"}>Apps</Button>
            </button>
            <WithAiFeatureFlagHOC flag="AI_MCP_CONNECTORS" disabledFallback={<></>} workspaceSlug={workspaceSlug || ""}>
              <button
                onClick={() => handleTabChange("connectors")}
                className={cn(
                  "flex items-center gap-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === "connectors"
                    ? "border-primary-dark text-primary"
                    : "border-transparent text-tertiary hover:text-secondary"
                )}
              >
                <Button variant={activeTab === "connectors" ? "tertiary" : "ghost"}>Connectors</Button>
              </button>
            </WithAiFeatureFlagHOC>
          </div>
          {activeTab === "apps" ? (
            <AppListRoot
              workspaceSlug={workspaceSlug || ""}
              apps={applications}
              supportedIntegrations={supportedIntegrations}
            />
          ) : (
            <ConnectorListRoot workspaceSlug={workspaceSlug || ""} />
          )}
        </>
      </div>
    </>
  );
}

export default observer(WorkspaceIntegrationsPage);
