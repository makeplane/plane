import React from "react";

import { useRouter } from "next/router";
import type { NextPage, GetServerSideProps } from "next";

import useSWR from "swr";

// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// constants
import { WORKSPACE_DETAILS } from "constants/fetch-keys";
// services
import workspaceService from "lib/services/workspace.service";
// layouts
import SettingsLayout from "layouts/settings-layout";
// ui
import { BreadcrumbItem, Breadcrumbs, Button } from "ui";

type TBillingSettingsProps = {
  isOwner: boolean;
  isMember: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const BillingSettings: NextPage<TBillingSettingsProps> = (props) => {
  const {
    query: { workspaceSlug },
  } = useRouter();

  const { data: activeWorkspace } = useSWR(
    workspaceSlug ? WORKSPACE_DETAILS(workspaceSlug as string) : null,
    () => (workspaceSlug ? workspaceService.getWorkspace(workspaceSlug as string) : null)
  );

  return (
    <>
      <SettingsLayout
        memberType={{ ...props }}
        type="workspace"
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeWorkspace?.name ?? "Workspace"}`}
              link={`/${workspaceSlug}`}
            />
            <BreadcrumbItem title="Members Settings" />
          </Breadcrumbs>
        }
      >
        <section className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">Billing & Plans</h3>
            <p className="mt-4 text-sm text-gray-500">[Free launch preview] plan Pro</p>
          </div>
          <div className="space-y-8 md:w-2/3">
            <div>
              <div className="w-80 rounded-md border bg-white p-4 text-center">
                <h4 className="text-md mb-1 leading-6 text-gray-900">Payment due</h4>
                <h2 className="text-3xl font-extrabold">--</h2>
              </div>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6 text-gray-900">Current plan</h4>
              <p className="mb-3 text-sm text-gray-500">You are currently using the free plan</p>
              <a href="https://plane.so/pricing" target="_blank" rel="noreferrer">
                <Button theme="secondary" size="rg" className="text-xs">
                  View Plans and Upgrade
                </Button>
              </a>
            </div>
            <div>
              <h4 className="text-md mb-1 leading-6 text-gray-900">Billing history</h4>
              <p className="mb-3 text-sm text-gray-500">There are no invoices to display</p>
            </div>
          </div>
        </section>
      </SettingsLayout>
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

export default BillingSettings;
