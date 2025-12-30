import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, WORKSPACE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { WorkspaceAPITokenService } from "@plane/services";
// component
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokenListItem } from "@/components/api-token/token-list-item";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
// constants
import { WORKSPACE_API_TOKENS_LIST } from "@/constants/fetch-keys";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// store hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

const workspaceApiTokenService = new WorkspaceAPITokenService();

function ApiTokensPage({ params }: Route.ComponentProps) {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { data: tokens } = useSWR(
    canPerformWorkspaceAdminActions ? WORKSPACE_API_TOKENS_LIST(workspaceSlug) : null,
    canPerformWorkspaceAdminActions ? () => workspaceApiTokenService.list(workspaceSlug) : null
  );

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.api_tokens.title")}`
    : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper>
      <PageHead title={pageTitle} />
      {!tokens ? (
        <APITokenSettingsLoader title={t("workspace_settings.settings.api_tokens.title")} />
      ) : (
        <div className="w-full">
          <CreateApiTokenModal
            isOpen={isCreateTokenModalOpen}
            onClose={() => setIsCreateTokenModalOpen(false)}
            workspaceSlug={workspaceSlug}
          />
          <SettingsHeading
            title={t("workspace_settings.settings.api_tokens.heading")}
            description={t("workspace_settings.settings.api_tokens.description")}
            button={{
              label: t("workspace_settings.settings.api_tokens.add_token"),
              onClick: () => {
                captureClick({
                  elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.HEADER_ADD_PAT_BUTTON,
                });
                setIsCreateTokenModalOpen(true);
              },
            }}
          />
          {tokens.length > 0 ? (
            <div className="flex h-full w-full flex-col">
              <div className="h-full w-full overflow-y-auto">
                {tokens.map((token) => (
                  <ApiTokenListItem key={token.id} token={token} workspaceSlug={workspaceSlug} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col">
              <div className="h-full w-full flex items-center justify-center">
                <EmptyStateCompact
                  assetKey="token"
                  title={t("settings_empty_state.tokens.title")}
                  description={t("settings_empty_state.tokens.description")}
                  actions={[
                    {
                      label: t("settings_empty_state.tokens.cta_primary"),
                      onClick: () => {
                        captureClick({
                          elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.EMPTY_STATE_ADD_PAT_BUTTON,
                        });
                        setIsCreateTokenModalOpen(true);
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
      )}
    </SettingsContentWrapper>
  );
}

export default observer(ApiTokensPage);
