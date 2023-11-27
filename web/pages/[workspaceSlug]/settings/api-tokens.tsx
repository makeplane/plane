import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// component
import { WorkspaceSettingHeader } from "components/headers";
import { ApiTokenEmptyState, ApiTokenListItem, CreateApiTokenModal } from "components/api-token";
// ui
import { Button, Spinner } from "@plane/ui";
// services
import { APITokenService } from "services/api_token.service";
// types
import { NextPageWithLayout } from "types/app";
// constants
import { API_TOKENS_LIST } from "constants/fetch-keys";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";

const apiTokenService = new APITokenService();

const ApiTokensPage: NextPageWithLayout = observer(() => {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    user: { currentWorkspaceRole },
  } = useMobxStore();

  const { data: tokens } = useSWR(
    workspaceSlug && currentWorkspaceRole === 20 ? API_TOKENS_LIST(workspaceSlug.toString()) : null,
    () => (workspaceSlug && currentWorkspaceRole === 20 ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null)
  );

  if (currentWorkspaceRole !== 20)
    return (
      <div className="h-full w-full flex justify-center mt-10 p-4">
        <p className="text-custom-text-300 text-sm">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <>
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      {tokens ? (
        tokens.length > 0 ? (
          <section className="pr-9 py-8 w-full overflow-y-auto">
            <div className="flex items-center justify-between py-3.5 border-b border-custom-border-200 mb-2">
              <h3 className="text-xl font-medium">API tokens</h3>
              <Button variant="primary" onClick={() => setIsCreateTokenModalOpen(true)}>
                Add API token
              </Button>
            </div>
            <div>
              {tokens.map((token) => (
                <ApiTokenListItem key={token.id} token={token} />
              ))}
            </div>
          </section>
        ) : (
          <div className="mx-auto py-8">
            <ApiTokenEmptyState onClick={() => setIsCreateTokenModalOpen(true)} />
          </div>
        )
      ) : (
        <div className="h-full w-full grid place-items-center p-4">
          <Spinner />
        </div>
      )}
    </>
  );
});

ApiTokensPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="API Tokens" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default ApiTokensPage;
