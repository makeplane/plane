import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// services
import WorkspaceIntegrationService from "services/integration";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
import IntegrationGuide from "components/integration/guide";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { UserAuth } from "types";
import type { GetServerSideProps, NextPage } from "next";
// fetch-keys
import { APP_INTEGRATIONS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

const ImportExport: NextPage<UserAuth> = (props) => {
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, provider } = router.query as {
    workspaceSlug: string;
    provider: string;
  };

  // fetching all the app integrations available
  const { data: allIntegrations, error: allIntegrationsError } = useSWR(APP_INTEGRATIONS, () =>
    WorkspaceIntegrationService.listAllIntegrations()
  );

  // fetching all the workspace integrations
  const { data: allWorkspaceIntegrations, error: allWorkspaceIntegrationsError } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    workspaceSlug
      ? () => WorkspaceIntegrationService.listWorkspaceIntegrations(workspaceSlug)
      : null
  );

  // fetching list of importers that already initialized
  const { data: allIntegrationImporters, error: allIntegrationImportersError } = useSWR<
    any | undefined,
    Error
  >(
    workspaceSlug ? `INTEGRATION_IMPORTERS_${workspaceSlug.toUpperCase()}` : null,
    workspaceSlug
      ? () => WorkspaceIntegrationService.fetchImportExportIntegrationStatus(workspaceSlug)
      : null
  );

  return (
    <>
      <AppLayout
        memberType={props}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title={`${workspaceSlug ?? "Workspace"}`} link={`/${workspaceSlug}`} />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
        settingsLayout
      >
        <section className="space-y-5">
          <IntegrationGuide
            workspaceSlug={workspaceSlug}
            provider={provider}
            allIntegrations={allIntegrations}
            allIntegrationsError={allIntegrationsError}
            allWorkspaceIntegrations={allWorkspaceIntegrations}
            allWorkspaceIntegrationsError={allWorkspaceIntegrationsError}
            allIntegrationImporters={allIntegrationImporters}
            allIntegrationImportersError={allIntegrationImportersError}
          />
        </section>
      </AppLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const workspaceSlug = ctx.params?.workspaceSlug as string;

  const memberDetail = await requiredWorkspaceAdmin(workspaceSlug, ctx.req.headers.cookie);

  if (memberDetail === null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ImportExport;
