import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// hooks
import { useUser, useWebhook, useWorkspace } from "hooks/store";
// layouts
import { AppLayout } from "layouts/app-layout";
import { WorkspaceSettingLayout } from "layouts/settings-layout";
// components
import { WorkspaceSettingHeader } from "components/headers";
import { WebhooksList, CreateWebhookModal } from "components/web-hooks";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// ui
import { Button } from "@plane/ui";
import { WebhookSettingsLoader } from "components/ui";
// types
import { NextPageWithLayout } from "lib/types";
// constants
import { WORKSPACE_SETTINGS_EMPTY_STATE_DETAILS } from "constants/empty-state";

const WebhooksListPage: NextPageWithLayout = observer(() => {
  // states
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // theme
  const { resolvedTheme } = useTheme();
  // mobx store
  const {
    membership: { currentWorkspaceRole },
    currentUser,
  } = useUser();
  const { fetchWebhooks, webhooks, clearSecretKey, webhookSecretKey, createWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();

  const isAdmin = currentWorkspaceRole === 20;

  useSWR(
    workspaceSlug && isAdmin ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug && isAdmin ? () => fetchWebhooks(workspaceSlug.toString()) : null
  );

  const emptyStateDetail = WORKSPACE_SETTINGS_EMPTY_STATE_DETAILS["webhooks"];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("workspace-settings", "webhooks", isLightMode);

  // clear secret key when modal is closed.
  useEffect(() => {
    if (!showCreateWebhookModal && webhookSecretKey) clearSecretKey();
  }, [showCreateWebhookModal, webhookSecretKey, clearSecretKey]);

  if (!isAdmin)
    return (
      <div className="mt-10 flex h-full w-full justify-center p-4">
        <p className="text-sm text-custom-text-300">You are not authorized to access this page.</p>
      </div>
    );

  if (!webhooks) return <WebhookSettingsLoader />;

  return (
    <div className="h-full w-full overflow-hidden py-8 pr-9">
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
          <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 pb-3.5">
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
            <EmptyState
              title={emptyStateDetail.title}
              description={emptyStateDetail.description}
              image={emptyStateImage}
              size="lg"
            />
          </div>
        </div>
      )}
    </div>
  );
});

WebhooksListPage.getLayout = function getLayout(page: React.ReactElement) {
  return (
    <AppLayout header={<WorkspaceSettingHeader title="Webhook settings" />}>
      <WorkspaceSettingLayout>{page}</WorkspaceSettingLayout>
    </AppLayout>
  );
};

export default WebhooksListPage;
