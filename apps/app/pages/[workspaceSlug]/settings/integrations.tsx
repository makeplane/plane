import React from "react";

import { useRouter } from "next/router";
import useSWR from "swr";

// lib
import type { NextPage, GetServerSideProps } from "next";
import { requiredWorkspaceAdmin } from "lib/auth";
// constants
// services
import workspaceService from "services/workspace.service";
// layouts
import AppLayout from "layouts/app-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { WORKSPACE_DETAILS, APP_INTEGRATIONS } from "constants/fetch-keys";
import OAuthPopUp from "components/popup";

type TWorkspaceIntegrationsProps = {
  isOwner: boolean;
  isMember: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const WorkspaceIntegrations: NextPage<TWorkspaceIntegrationsProps> = (props) => {
  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  const { data: integrations } = useSWR(workspaceSlug ? APP_INTEGRATIONS : null, () =>
    workspaceSlug ? workspaceService.getIntegrations() : null
  );

  return (
    <>
      <AppLayout
        settingsLayout="workspace"
        memberType={props}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeWorkspace?.name ?? "Workspace"}`}
              link={`/${workspaceSlug}`}
            />
            <BreadcrumbItem title="Integrations" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          {integrations?.map((integration: any) => (
            <OAuthPopUp
              workspaceSlug={workspaceSlug}
              key={integration.id}
              integration={integration}
            />
          ))}
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

export default WorkspaceIntegrations;
