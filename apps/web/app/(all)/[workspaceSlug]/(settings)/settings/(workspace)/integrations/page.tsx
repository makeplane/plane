"use client";
import { observer } from "mobx-react";

// component
import Link from "next/link";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel, SILO_BASE_URL, SILO_BASE_PATH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
// hooks
import SettingsHeading from "@/components/settings/heading";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
import { APPLICATIONS_LIST } from "@/constants/fetch-keys";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web components
import { AppListRoot } from "@/plane-web/components/marketplace";
import { useApplications } from "@/plane-web/hooks/store";
import { SiloAppService } from "@/plane-web/services/integrations/silo.service";

const siloAppService = new SiloAppService(encodeURI(SILO_BASE_URL + SILO_BASE_PATH));

const IntegrationsListPage = observer(() => {
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { slug: workspaceSlug } = currentWorkspace || {};
  const { fetchApplications, getApplicationsForWorkspace } = useApplications();

  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Applications` : undefined;
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

  if (!data || isLoading || !applications || !supportedIntegrations || supportedIntegrationsLoading) {
    return <EmailSettingsLoader />;
  }

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <SettingsHeading
          title={t("workspace_settings.settings.integrations.page_title")}
          description={t("workspace_settings.settings.integrations.page_description")}
          appendToRight={
            <Link href={`create`}>
              <Button variant="primary">Build your own</Button>
            </Link>
          }
        />
        <div className="w-full border-t border-custom-border-100 pb-6" />
        {workspaceSlug && <AppListRoot apps={applications} supportedIntegrations={supportedIntegrations} />}
      </section>
    </>
  );
});

export default IntegrationsListPage;
