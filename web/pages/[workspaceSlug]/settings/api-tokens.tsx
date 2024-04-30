import React, { useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// store hooks
import { Button } from "@plane/ui";
import { ApiTokenListItem, CreateApiTokenModal } from "@/components/api-token";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { WorkspaceSettingHeader } from "@/components/headers";
import { APITokenSettingsLoader } from "@/components/ui";
import { EmptyStateType } from "@/constants/empty-state";
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
import { EUserWorkspaceRoles } from "@/constants/workspace";
import { useUser, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// component
// ui
// services
import { NextPageWithLayout } from "@/lib/types";
import { APITokenService } from "@/services/api_token.service";
// types
// constants

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
  const { currentWorkspace } = useWorkspace();

  const isAdmin = currentWorkspaceRole === EUserWorkspaceRoles.ADMIN;

  const { data: tokens } = useSWR(workspaceSlug && isAdmin ? API_TOKENS_LIST(workspaceSlug.toString()) : null, () =>
    workspaceSlug && isAdmin ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null
  );

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - API Tokens` : undefined;

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <section className="w-full overflow-y-auto md:pr-9 pr-4">
        {tokens.length > 0 ? (
          <>
            <div className="flex items-center justify-between border-b border-custom-border-200 py-3.5">
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
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 pb-3.5">
              <h3 className="text-xl font-medium">API tokens</h3>
              <Button variant="primary" onClick={() => setIsCreateTokenModalOpen(true)}>
                Add API token
              </Button>
            </div>
            <div className="h-full w-full flex items-center justify-center">
              <EmptyState type={EmptyStateType.WORKSPACE_SETTINGS_API_TOKENS} />
            </div>
          </div>
        )}
      </section>
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
