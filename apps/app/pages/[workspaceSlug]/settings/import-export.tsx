import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// services
import IntegrationService from "services/integration";
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
import {
  APP_INTEGRATIONS,
  IMPORTER_SERVICES_LIST,
  WORKSPACE_INTEGRATIONS,
} from "constants/fetch-keys";

const ImportExport: NextPage<UserAuth> = (props) => {
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, provider } = router.query;

  const { data: appIntegrations } = useSWR(APP_INTEGRATIONS, () =>
    IntegrationService.getAppIntegrationsList()
  );

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    workspaceSlug
      ? () => IntegrationService.getWorkspaceIntegrationsList(workspaceSlug as string)
      : null
  );

  const { data: importerServices } = useSWR(
    workspaceSlug ? IMPORTER_SERVICES_LIST(workspaceSlug as string) : null,
    workspaceSlug ? () => IntegrationService.getImporterServicesList(workspaceSlug as string) : null
  );

  return (
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
      <IntegrationGuide
        provider={provider as string}
        appIntegrations={appIntegrations}
        workspaceIntegrations={workspaceIntegrations}
        importerServices={importerServices}
      />
    </AppLayout>
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
