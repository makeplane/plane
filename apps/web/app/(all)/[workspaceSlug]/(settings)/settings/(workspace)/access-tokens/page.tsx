/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { WorkspaceAPITokenService } from "@plane/services";
// component
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokenListItem } from "@/components/api-token/token-list-item";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { InstanceTokensDisabledBanner } from "@/components/api-token/instance-disabled-banner";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
// constants
import { WORKSPACE_API_TOKENS_LIST } from "@/constants/fetch-keys";
// store hooks
import { useInstance } from "@/hooks/store/use-instance";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

import { WorkspaceAccessTokensHeader } from "./header";

const workspaceApiTokenService = new WorkspaceAPITokenService();

function ApiTokensPage({ params }: Route.ComponentProps) {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { config } = useInstance();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const areAccessTokensDisabled = Boolean(config?.are_access_tokens_disabled);

  const { data: tokens } = useSWR(WORKSPACE_API_TOKENS_LIST(workspaceSlug), () =>
    workspaceApiTokenService.list(workspaceSlug)
  );

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.api_tokens.title")}`
    : undefined;

  return (
    <SettingsContentWrapper header={<WorkspaceAccessTokensHeader />}>
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
            control={
              areAccessTokensDisabled ? null : (
                <Button variant="primary" size="lg" onClick={() => setIsCreateTokenModalOpen(true)}>
                  {t("workspace_settings.settings.api_tokens.add_token")}
                </Button>
              )
            }
          />
          {areAccessTokensDisabled && <InstanceTokensDisabledBanner />}
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
                  title={t("settings_empty_state.workspace_tokens.title")}
                  description={t("settings_empty_state.workspace_tokens.description")}
                  actions={
                    areAccessTokensDisabled
                      ? []
                      : [
                          {
                            label: t("settings_empty_state.workspace_tokens.cta_primary"),
                            onClick: () => {
                              setIsCreateTokenModalOpen(true);
                            },
                          },
                        ]
                  }
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
