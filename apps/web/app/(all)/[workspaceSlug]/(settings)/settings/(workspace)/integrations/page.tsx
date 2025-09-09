"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useUserProfile } from "@/hooks/store/use-user-profile";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { IntegrationsList, IntegrationsEmptyState } from "@/plane-web/components/integrations";
import { useFlag } from "@/plane-web/hooks/store";
// services
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";

const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

const WorkspaceIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUserProfile } = useUserProfile();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t("integrations.integrations")}` : undefined;
  // const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
  //   workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  // );
  const integrationsEnabled = useFlag(workspaceSlug?.toString(), "SILO_INTEGRATIONS");

  // Fetch Supported Integrations
  const { data: supportedIntegrations, isLoading: supportedIntegrationsLoading } = useSWR(
    `SILO_SUPPORTED_INTEGRATIONS`,
    () => siloAppService.getSupportedIntegrations(),
    {
      revalidateOnFocus: false,
    }
  );

  if (supportedIntegrationsLoading && !supportedIntegrations) {
    return (
      <SettingsContentWrapper size="lg">
        <PageHead title={pageTitle} />
        <section className="w-full flex flex-col">
          <SettingsHeading
            title={t("workspace_settings.settings.integrations.heading")}
            description={t("workspace_settings.settings.integrations.description")}
          />
          <Loader className="flex flex-wrap gap-4 mt-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Loader.Item height="200px" width="300px" key={index} />
            ))}
          </Loader>
        </section>
      </SettingsContentWrapper>
    );
  }

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  if (!integrationsEnabled)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="w-full flex flex-col gap-5">
          <SettingsHeading
            title={t("workspace_settings.settings.integrations.heading")}
            description={t("workspace_settings.settings.integrations.description")}
          />
          <IntegrationsEmptyState theme={currentUserProfile?.theme.theme || "light"} />
        </div>
      </>
    );

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full flex flex-col">
        <SettingsHeading
          title={t("workspace_settings.settings.integrations.heading")}
          description={t("workspace_settings.settings.integrations.description")}
        />
        {workspaceSlug && (
          <IntegrationsList
            workspaceSlug={workspaceSlug.toString()}
            supportedIntegrations={supportedIntegrations ?? []}
          />
        )}
      </section>
    </SettingsContentWrapper>
  );
});

export default WorkspaceIntegrationsPage;
