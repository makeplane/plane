import { NextPage } from "next";
import React from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/setting-layout";
import { WorkspaceSettingHeader } from "components/headers";
import { useMobxStore } from "lib/mobx/store-provider";
import { useRouter } from "next/router";
import useSWR from "swr";
import { ApiTokenService } from "services/api_token.service";
import { API_TOKEN_DETAILS } from "constants/fetch-keys";
import { Spinner } from "@plane/ui";
import { renderDateFormat } from "helpers/date-time.helper";

const apiTokenService = new ApiTokenService();
const ApiTokenDetail: NextPage = () => {
  const { theme: themStore } = useMobxStore();
  const router = useRouter();
  const { workspaceSlug, tokenId } = router.query;

  const { data: token } = useSWR(
    workspaceSlug && tokenId ? API_TOKEN_DETAILS(workspaceSlug.toString(), tokenId.toString()) : null,
    () =>
      workspaceSlug && tokenId ? apiTokenService.retrieveApiToken(workspaceSlug.toString(), tokenId.toString()) : null
  );

  return (
    <AppLayout header={<WorkspaceSettingHeader title="Api Tokens" />}>
      <WorkspaceSettingLayout>
        {token ? (
          <div className={`${themStore.sidebarCollapsed ? "xl:w-[50%] lg:w-[60%] " : "w-[60%]"} mx-auto py-8`}>
            <p className={"font-medium text-[24px]"}>{token.label}</p>
            <p className={"text-custom-text-300 text-lg pt-2"}>{token.description}</p>
            <div className="bg-custom-border-100 h-[1px] w-full mt-4"/>
            <p className="mt-2 text-sm text-custom-text-400/60">
              {token.expired_at ? "Expires on " + renderDateFormat(token.expired_at, true) : "Never Expires"}
            </p>

            <button className="border py-3 px-5 text-custom-primary-100 text-sm mt-6 rounded-md border-custom-primary-100 w-fit font-medium">
              Revoke
            </button>
          </div>
        ) : (
          <div className="flex justify-center pr-9 py-8  w-full min-h-full items-center">
            <Spinner />
          </div>
        )}
      </WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ApiTokenDetail;
