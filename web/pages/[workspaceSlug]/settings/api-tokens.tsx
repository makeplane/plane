import React, { useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// store hooks
import { useUser } from "hooks/store";
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
import { NextPageWithLayout } from "lib/types";
// constants
import { API_TOKENS_LIST } from "constants/fetch-keys";
import { EUserWorkspaceRoles } from "constants/workspace";

const apiTokenService = new APITokenService();

const ApiTokensPage: NextPageWithLayout = observer(() => {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  const { data: tokens } = useSWR(workspaceSlug && isAdmin ? API_TOKENS_LIST(workspaceSlug.toString()) : null, () =>
    workspaceSlug && isAdmin ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null
  );

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  return (
    <>
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      {tokens ? (
        <section className="w-full overflow-y-auto py-8 pr-9">
          {tokens.length > 0 ? (
            <>
              <div className="mb-2 flex items-center justify-between border-b border-custom-border-200 py-3.5">
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
            </>
          ) : (
            <div className="mx-auto">
              <ApiTokenEmptyState onClick={() => setIsCreateTokenModalOpen(true)} />
            </div>
          )}
        </section>
      ) : (
        <div className="grid h-full w-full place-items-center p-4">
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
