"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { PROFILE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// component
import { APITokenService } from "@plane/services";
import { ApiTokenListItem, CreateApiTokenModal } from "@/components/api-token";
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { SettingsHeading } from "@/components/settings";
import { APITokenSettingsLoader } from "@/components/ui";
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// store hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
// services

const apiTokenService = new APITokenService();

const ApiTokensPage = observer(() => {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/workspace-settings/api-tokens" });

  const { data: tokens } = useSWR(API_TOKENS_LIST, () => apiTokenService.list());

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.api_tokens.title")}`
    : undefined;

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  return (
    <div className="w-full">
      <PageHead title={pageTitle} />
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <section className="w-full">
        {tokens.length > 0 ? (
          <>
            <SettingsHeading
              title={t("account_settings.api_tokens.heading")}
              description={t("account_settings.api_tokens.description")}
              button={{
                label: t("workspace_settings.settings.api_tokens.add_token"),
                onClick: () => {
                  captureClick({
                    elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.HEADER_ADD_PAT_BUTTON,
                  });
                  setIsCreateTokenModalOpen(true);
                },
              }}
            />
            <div>
              {tokens.map((token) => (
                <ApiTokenListItem key={token.id} token={token} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col">
            <SettingsHeading
              title={t("account_settings.api_tokens.heading")}
              description={t("account_settings.api_tokens.description")}
              button={{
                label: t("workspace_settings.settings.api_tokens.add_token"),
                onClick: () => {
                  captureClick({
                    elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.HEADER_ADD_PAT_BUTTON,
                  });
                  setIsCreateTokenModalOpen(true);
                },
              }}
            />
            <div className="h-full w-full flex items-center justify-center">
              <DetailedEmptyState
                title=""
                description=""
                assetPath={resolvedPath}
                className="w-full !p-0 justify-center mx-auto"
                size="md"
                primaryButton={{
                  text: t("workspace_settings.settings.api_tokens.add_token"),
                  onClick: () => {
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.EMPTY_STATE_ADD_PAT_BUTTON,
                    });
                    setIsCreateTokenModalOpen(true);
                  },
                }}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
});

export default ApiTokensPage;
