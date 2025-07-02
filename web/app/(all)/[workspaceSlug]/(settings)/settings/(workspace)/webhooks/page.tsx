"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, WORKSPACE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// components
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { SettingsContentWrapper, SettingsHeading } from "@/components/settings";
import { WebhookSettingsLoader } from "@/components/ui";
import { WebhooksList, CreateWebhookModal } from "@/components/web-hooks";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
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
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  if (!webhooks) return <WebhookSettingsLoader />;

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <CreateWebhookModal
          createWebhook={createWebhook}
          clearSecretKey={clearSecretKey}
          currentWorkspace={currentWorkspace}
          isOpen={showCreateWebhookModal}
          onClose={() => {
            setShowCreateWebhookModal(false);
          }}
        />
        <SettingsHeading
          title={t("workspace_settings.settings.webhooks.title")}
          description={t("workspace_settings.settings.webhooks.description")}
          button={{
            label: t("workspace_settings.settings.webhooks.add_webhook"),
            onClick: () => {
              captureClick({
                elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.HEADER_ADD_WEBHOOK_BUTTON,
              });
              setShowCreateWebhookModal(true);
            },
          }}
        />
        {Object.keys(webhooks).length > 0 ? (
          <div className="flex h-full w-full flex-col">
            <WebhooksList />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="h-full w-full flex items-center justify-center">
              <DetailedEmptyState
                className="!p-0"
                title=""
                description=""
                assetPath={resolvedPath}
                size="md"
                primaryButton={{
                  text: t("workspace_settings.settings.webhooks.add_webhook"),
                  onClick: () => {
                    captureClick({
                      elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.EMPTY_STATE_ADD_WEBHOOK_BUTTON,
                    });
                    setShowCreateWebhookModal(true);
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
});

export default WebhooksListPage;
