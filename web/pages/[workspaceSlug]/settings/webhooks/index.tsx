import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// hooks
import { Button } from "@plane/ui";
import { PageHead } from "@/components/core";
import { EmptyState } from "@/components/empty-state";
import { WorkspaceSettingHeader } from "@/components/headers";
import { WebhookSettingsLoader } from "@/components/ui";
import { WebhooksList, CreateWebhookModal } from "@/components/web-hooks";
import { EmptyStateType } from "@/constants/empty-state";
import { useUser, useWebhook, useWorkspace } from "@/hooks/store";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { WorkspaceSettingLayout } from "@/layouts/settings-layout";
// components
// ui
// types
import { NextPageWithLayout } from "@/lib/types";
// constants

const WebhooksListPage: NextPageWithLayout = observer(() => {
  // states
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // mobx store
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  const { fetchWebhooks, webhooks, clearSecretKey, webhookSecretKey, createWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();

  const isAdmin = currentWorkspaceRole === 20;

  useSWR(
    workspaceSlug && isAdmin ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug && isAdmin ? () => fetchWebhooks(workspaceSlug.toString()) : null
  );

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Webhooks` : undefined;

  // clear secret key when modal is closed.
  useEffect(() => {
    if (!showCreateWebhookModal && webhookSecretKey) clearSecretKey();
  }, [showCreateWebhookModal, webhookSecretKey, clearSecretKey]);

  if (!isAdmin)
    return (
      <>
        <PageHead title={pageTitle} />
        <div className="mt-10 flex h-full w-full justify-center p-4">
          <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
        </div>
      </>
    );

  if (!webhooks) return <WebhookSettingsLoader />;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full overflow-y-auto md:pr-9 pr-4">
        <CreateWebhookModal
          createWebhook={createWebhook}
          clearSecretKey={clearSecretKey}
          currentWorkspace={currentWorkspace}
          isOpen={showCreateWebhookModal}
          onClose={() => {
            setShowCreateWebhookModal(false);
          }}
        />
        {Object.keys(webhooks).length > 0 ? (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 py-3.5">
              <div className="text-xl font-medium">Webhooks</div>
              <Button variant="primary" size="sm" onClick={() => setShowCreateWebhookModal(true)}>
                Add webhook
              </Button>
            </div>
            <WebhooksList />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 pb-3.5">
              <div className="text-xl font-medium">Webhooks</div>
              <Button variant="primary" size="sm" onClick={() => setShowCreateWebhookModal(true)}>
                Add webhook
              </Button>
            </div>
            <div className="h-full w-full flex items-center justify-center">
              <EmptyState type={EmptyStateType.WORKSPACE_SETTINGS_WEBHOOKS} />
            </div>
          </div>
        )}
      </div>
    </>
  );
});

WebhooksListPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WebhooksListPage;
