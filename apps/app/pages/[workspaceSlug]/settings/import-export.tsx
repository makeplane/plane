// next imports
import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// hooks
import useToast from "hooks/use-toast";
// layouts
import AppLayout from "layouts/app-layout";
import IntegrationGuide from "components/integration/guide";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { UserAuth, IAppIntegrations } from "types";
// api services
import WorkspaceIntegrationService from "services/integration";

const ImportExport: NextPage<UserAuth> = (props) => {
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, provider } = router.query as {
    workspaceSlug: string;
    provider: string;
  };

  // fetching all the integrations available
  const { data: allIntegrations, error: allIntegrationsError } = useSWR<
    IAppIntegrations[] | undefined,
    Error
  >(
    workspaceSlug ? `ALL_INTEGRATIONS_${workspaceSlug.toUpperCase()}` : null,
    workspaceSlug ? () => WorkspaceIntegrationService.listAllIntegrations() : null
  );

  // fetching all the integrations available
  const { data: allWorkspaceIntegrations, error: allWorkspaceIntegrationsError } = useSWR<
    any | undefined,
    Error
  >(
    workspaceSlug ? `WORKSPACE_INTEGRATIONS_${workspaceSlug.toUpperCase()}` : null,
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
