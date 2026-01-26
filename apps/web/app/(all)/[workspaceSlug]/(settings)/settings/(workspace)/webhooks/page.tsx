import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { WebhookSettingsLoader } from "@/components/ui/loader/settings/web-hook";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WebhooksList, CreateWebhookModal } from "@/components/web-hooks";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { WebhooksWorkspaceSettingsHeader } from "./header";

function WebhooksListPage({ params }: Route.ComponentProps) {
  // states
  const [showCreateWebhookModal, setShowCreateWebhookModal] = useState(false);
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // mobx store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { fetchWebhooks, webhooks, clearSecretKey, webhookSecretKey, createWebhook } = useWebhook();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  useSWR(
    canPerformWorkspaceAdminActions ? `WEBHOOKS_LIST_${workspaceSlug}` : null,
    canPerformWorkspaceAdminActions ? () => fetchWebhooks(workspaceSlug) : null
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
    <SettingsContentWrapper header={<WebhooksWorkspaceSettingsHeader />}>
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
          control={
            <Button variant="primary" size="lg" onClick={() => setShowCreateWebhookModal(true)}>
              {t("workspace_settings.settings.webhooks.add_webhook")}
            </Button>
          }
        />
        {Object.keys(webhooks).length > 0 ? (
          <div className="mt-4">
            <WebhooksList />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="h-full w-full flex items-center justify-center">
              <EmptyStateCompact
                assetKey="webhook"
                title={t("settings_empty_state.webhooks.title")}
                description={t("settings_empty_state.webhooks.description")}
                actions={[
                  {
                    label: t("settings_empty_state.webhooks.cta_primary"),
                    onClick: () => {
                      setShowCreateWebhookModal(true);
                    },
                  },
                ]}
                align="start"
                rootClassName="py-20"
              />
            </div>
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(WebhooksListPage);
