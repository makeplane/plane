"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { WebhookSettingsLoader } from "@/components/ui";
import { WebhooksList, CreateWebhookModal } from "@/components/web-hooks";
// hooks
import { useUserPermissions, useWebhook, useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const WebhooksListPage = observer(() => {
  // states
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // mobx store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { fetchWebhooks, webhooks, clearSecretKey, webhookSecretKey, createWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/workspace-settings/webhooks" });

  useSWR(
    workspaceSlug && canPerformWorkspaceAdminActions ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    workspaceSlug && canPerformWorkspaceAdminActions ? () => fetchWebhooks(workspaceSlug.toString()) : null
  );

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.webhooks.title")}`
    : undefined;

  // clear secret key when modal is closed.
  useEffect(() => {
    if (!showCreateWebhookModal && webhookSecretKey) clearSecretKey();
  }, [showCreateWebhookModal, webhookSecretKey, clearSecretKey]);

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  if (!webhooks) return <WebhookSettingsLoader />;

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="w-full overflow-y-auto">
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
              <div className="text-xl font-medium">{t("workspace_settings.settings.webhooks.title")}</div>
              <Button variant="primary" size="sm" onClick={() => setShowCreateWebhookModal(true)}>
                {t("workspace_settings.settings.webhooks.add_webhook")}
              </Button>
            </div>
            <WebhooksList />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 pb-3.5">
              <div className="text-xl font-medium">{t("workspace_settings.settings.webhooks.title")}</div>
              <Button variant="primary" size="sm" onClick={() => setShowCreateWebhookModal(true)}>
                {t("workspace_settings.settings.webhooks.add_webhook")}
              </Button>
            </div>
            <div className="h-full w-full flex items-center justify-center">
              <DetailedEmptyState
                title={t("workspace_settings.empty_state.webhooks.title")}
                description={t("workspace_settings.empty_state.webhooks.description")}
                assetPath={resolvedPath}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
});

export default WebhooksListPage;
