"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// component
import { ApiTokenListItem, CreateApiTokenModal } from "@/components/api-token";
import { NotAuthorizedView } from "@/components/auth-screens";
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { APITokenSettingsLoader } from "@/components/ui";
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// store hooks
import { useUserPermissions, useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// services
import { APITokenService } from "@/services/api_token.service";

const apiTokenService = new APITokenService();

const ApiTokensPage = observer(() => {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/workspace-settings/api-tokens" });

  const { data: tokens } = useSWR(
    workspaceSlug && canPerformWorkspaceAdminActions ? API_TOKENS_LIST(workspaceSlug.toString()) : null,
    () =>
      workspaceSlug && canPerformWorkspaceAdminActions ? apiTokenService.getApiTokens(workspaceSlug.toString()) : null
  );

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.api_tokens.title")}`
    : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" />;
  }

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <section className="w-full overflow-y-auto">
        {tokens.length > 0 ? (
          <>
            <div className="flex items-center justify-between border-b border-custom-border-200 pb-3.5">
              <h3 className="text-xl font-medium">{t("workspace_settings.settings.api_tokens.title")}</h3>
              <Button variant="primary" onClick={() => setIsCreateTokenModalOpen(true)}>
                {t("workspace_settings.settings.api_tokens.add_token")}
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
              <h3 className="text-xl font-medium">{t("workspace_settings.settings.api_tokens.title")}</h3>
              <Button variant="primary" onClick={() => setIsCreateTokenModalOpen(true)}>
                {t("workspace_settings.settings.api_tokens.add_token")}
              </Button>
            </div>
            <div className="h-full w-full flex items-center justify-center">
              <DetailedEmptyState
                title={t("workspace_settings.empty_state.api_tokens.title")}
                description={t("workspace_settings.empty_state.api_tokens.description")}
                assetPath={resolvedPath}
              />
            </div>
          </div>
        )}
      </section>
    </>
  );
});

export default ApiTokensPage;
