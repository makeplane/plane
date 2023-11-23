import { useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { DeleteTokenModal } from "components/api-token";
import { WorkspaceSettingHeader } from "components/headers";
// ui
import { Spinner } from "@plane/ui";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// services
import { APITokenService } from "services/api_token.service";
// helpers
import { renderDateFormat } from "helpers/date-time.helper";
// constants
import { API_TOKEN_DETAILS } from "constants/fetch-keys";
// swr
import useSWR from "swr";

const apiTokenService = new APITokenService();

const APITokenDetail: NextPage = () => {
  const { theme: themStore } = useMobxStore();
  const [deleteTokenModal, setDeleteTokenModal] = useState<boolean>(false);
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
        <DeleteTokenModal isOpen={deleteTokenModal} handleClose={() => setDeleteTokenModal(false)} />
        {token ? (
          <div className={`${themStore.sidebarCollapsed ? "xl:w-[50%] lg:w-[60%] " : "w-[60%]"} mx-auto py-8`}>
            <p className={"font-medium text-[24px]"}>{token.label}</p>
            <p className={"text-custom-text-300 text-lg pt-2"}>{token.description}</p>
            <div className="bg-custom-border-100 h-[1px] w-full mt-4" />
            <p className="mt-2 text-sm text-custom-text-400/60">
              {token.expired_at ? "Expires on " + renderDateFormat(token.expired_at, true) : "Never Expires"}
            </p>

            <button
              className="border py-3 px-5 text-custom-primary-100 text-sm mt-6 rounded-md border-custom-primary-100 w-fit font-medium"
              onClick={() => {
                setDeleteTokenModal(true);
              }}
            >
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

export default APITokenDetail;
