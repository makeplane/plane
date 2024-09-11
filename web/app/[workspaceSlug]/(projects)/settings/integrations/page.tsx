"use client";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR from "swr";
// components
import { getButtonStyling } from "@plane/ui";
import { PageHead } from "@/components/core";
import { SingleIntegrationCard } from "@/components/integration";
import { IntegrationAndImportExportBanner, IntegrationsSettingsLoader } from "@/components/ui";
// constants
import { APP_INTEGRATIONS } from "@/constants/fetch-keys";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
// services
import { IntegrationService } from "@/services/integrations";

const integrationService = new IntegrationService();

const WorkspaceIntegrationsPage = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    userProfile: { data: userProfile },
    membership: { currentWorkspaceRole },
  } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const isDarkMode = userProfile?.theme.theme === "dark";
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Integrations` : undefined;

  const { data: appIntegrations } = useSWR(workspaceSlug && isAdmin ? APP_INTEGRATIONS : null, () =>
    workspaceSlug && isAdmin ? integrationService.getAppIntegrationsList() : null
  );

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (true)
    return (
      <div className="flex h-full flex-col gap-10 rounded-xl">
        <div className="flex items-center border-b border-custom-border-100 py-3.5">
          <h3 className="text-xl font-medium">Integrations</h3>
        </div>
        <div
          className={cn("item-center flex min-h-[25rem] justify-between rounded-xl", {
            "bg-gradient-to-l from-[#343434] via-[#484848]  to-[#1E1E1E]": userProfile?.theme.theme === "dark",
            "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": userProfile?.theme.theme === "light",
          })}
        >
          <div className="relative flex flex-col justify-center gap-7 pl-8 lg:w-1/2">
            <div className="flex max-w-96 flex-col gap-2">
              <h2 className="text-2xl font-semibold">Popular integrations are coming soon!</h2>
              <p className="text-base font-medium text-custom-text-300">
                Send changes in issues to Slack, turn a Support email into a ticket in Plane, and more—coming soon to
                Pro on Plane Cloud and One.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                className={`${getButtonStyling("primary", "md")} cursor-pointer`}
                href="https://ece39166.sibforms.com/serve/MUIFAPPLJk02NaZT7ZOinKdoKPL351GVFpEmit1jpJixcLlqd3TaulIT9Czmu0yDy_5bqzuVmEu6Y6oUc09X2NIhI88jplFs0G6ARQa6NxHxACHAUtKNQhOmyI7zpC4MLV_E3kkwlwbzguZyKKURADedKgRarGu77LFz6f9CH-DUDntNbrooJhU1-vndV1EyWNrFgvjMDjz2wSat"
                target="_blank"
                rel="noreferrer"
              >
                Stay in loop
              </a>
            </div>
          </div>
          <div className="relative hidden w-1/2 lg:block">
            <span className="absolute bottom-0 right-0">
              <Image
                src={`/upcoming-features/integrations-cta-1-${isDarkMode ? "dark" : "light"}.png`}
                height={420}
                width={420}
                alt="cta-1"
              />
            </span>
            <span className="absolute -bottom-16 right-1/2 rounded-xl">
              <Image
                src={`/upcoming-features/integrations-cta-2-${isDarkMode ? "dark" : "light"}.png`}
                height={210}
                width={280}
                alt="cta-2"
              />
            </span>
          </div>
        </div>
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <section className="w-full overflow-y-auto">
        <IntegrationAndImportExportBanner bannerName="Integrations" />
        <div>
          {appIntegrations ? (
            appIntegrations?.map((integration) => (
              <SingleIntegrationCard key={integration.id} integration={integration} />
            ))
          ) : (
            <IntegrationsSettingsLoader />
          )}
        </div>
      </section>
    </>
  );
});

export default WorkspaceIntegrationsPage;
