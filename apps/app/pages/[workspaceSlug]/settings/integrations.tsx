import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import workspaceService from "services/workspace.service";
// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// componentss
import OAuthPopUp from "components/popup";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage, GetServerSideProps } from "next";
import { UserAuth } from "types";
// fetch-keys
import { WORKSPACE_DETAILS, APP_INTEGRATIONS } from "constants/fetch-keys";

const WorkspaceIntegrations: NextPage<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

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
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Integrations</h3>
            <p className="mt-4 text-sm text-gray-500">Manage the workspace integrations.</p>
          </div>
          <div className="space-y-4">
            {integrations ? (
              integrations.map((integration) => (
                <OAuthPopUp
                  key={integration.id}
                  workspaceSlug={workspaceSlug}
                  integration={integration}
                />
              ))
            ) : (
              <Loader className="space-y-5">
                <Loader.Item height="60px" />
                <Loader.Item height="60px" />
              </Loader>
            )}
          </div>
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
