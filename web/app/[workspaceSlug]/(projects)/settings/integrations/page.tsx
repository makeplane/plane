"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel, SILO_BASE_PATH, SILO_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { IntegrationsEmptyState } from "@/components/integration";
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

  return (
    <>
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
    </>
  );
});

export default WorkspaceIntegrationsPage;
