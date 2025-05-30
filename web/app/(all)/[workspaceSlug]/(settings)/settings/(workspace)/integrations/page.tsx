"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core/page-title";
import { IntegrationsEmptyState } from "@/components/integration";
import { SettingsContentWrapper } from "@/components/settings";
// hooks
import { useUserPermissions, useUserProfile, useWorkspace } from "@/hooks/store";
// plane web components
import { IntegrationsList } from "@/plane-web/components/integrations";
// plane web hooks
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

  if (supportedIntegrationsLoading) {
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center">
          <p className="text-sm text-custom-text-300">{t("integrations.loading")}</p>
        </div>
      </>
    );
  }

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center">
          <p className="text-sm text-custom-text-300">{t("integrations.unauthorized")}</p>
        </div>
      </>
    );

  if (!integrationsEnabled)
    return (
      <>
        <PageHead title={pageTitle} />
        <IntegrationsEmptyState theme={currentUserProfile?.theme.theme || "light"} />
      </>
    );

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  return (
    <SettingsContentWrapper size="lg">
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <div className="flex items-center border-b border-custom-border-100 pb-3.5">
          <h3 className="text-xl font-medium">{t("integrations.integrations")}</h3>
        </div>
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
