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
import Link from "next/link";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { getButtonStyling } from "@plane/propel/button";
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

const siloAppService = new SiloAppService();

function WorkspaceIntegrationsPage() {
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { slug: workspaceSlug } = currentWorkspace || {};
  const { fetchApplications, getApplicationsForWorkspace } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;
  const applications = getApplicationsForWorkspace(workspaceSlug || "");

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
  const isUnauthorized = workspaceUserInfo && !canPerformWorkspaceAdminActions;

  if (areIntegrationsLoading) {
    return <EmailSettingsLoader />;
  }

  if (isUnauthorized) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <SettingsHeading
          title={t("workspace_settings.settings.integrations.title")}
          description={t("workspace_settings.settings.integrations.page_description")}
          control={
            <Link href={`/${workspaceSlug}/settings/integrations/create`} className={getButtonStyling("primary", "lg")}>
              Build your own
            </Link>
          }
        />
        <div className="mt-6">
          <AppListRoot apps={applications} supportedIntegrations={supportedIntegrations} />
        </div>
      </section>
    </>
  );
}

export default observer(WorkspaceIntegrationsPage);
