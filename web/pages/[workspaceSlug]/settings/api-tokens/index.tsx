import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// component
import { WorkspaceSettingHeader } from "components/headers";
import { APITokenEmptyState, APITokenListItem } from "components/api-token";
// ui
import { Spinner, Button } from "@plane/ui";
// services
import { APITokenService } from "services/api_token.service";
// types
import { NextPageWithLayout } from "types/app";
// constants
import { API_TOKENS_LIST } from "constants/fetch-keys";

const apiTokenService = new APITokenService();

const ApiTokensPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: tokens, isLoading } = useSWR(workspaceSlug ? API_TOKENS_LIST(workspaceSlug.toString()) : null, () =>
    workspaceSlug ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null
  );

  if (isLoading)
    return (
      <div className="flex justify-center pr-9 py-8  w-full min-h-full items-center">
        <Spinner />
      </div>
    );

  return (
    <>
      {tokens && tokens.length > 0 ? (
        <section className="pr-9 py-8 w-full overflow-y-auto">
          <div className="flex items-center justify-between py-3.5 border-b border-custom-border-200 mb-2">
            <h3 className="text-xl font-medium">API Tokens</h3>
            <Button
              variant="primary"
              onClick={() => {
                router.push(`${router.asPath}/create/`);
              }}
            >
              Add API Token
            </Button>
          </div>
          <div>
            {tokens?.map((token) => (
              <APITokenListItem token={token} workspaceSlug={workspaceSlug} />
            ))}
          </div>
        </section>
      ) : (
        <div className="mx-auto py-8">
          <APITokenEmptyState />
        </div>
      )}
    </>
  );
};

ApiTokensPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="API Tokens" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ApiTokensPage;
