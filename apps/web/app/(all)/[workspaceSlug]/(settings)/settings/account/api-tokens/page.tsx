"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { PROFILE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// component
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { APITokenService } from "@plane/services";
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokenListItem } from "@/components/api-token/token-list-item";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
import { API_TOKENS_LIST } from "@/constants/fetch-keys";
// store hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store/use-workspace";

const apiTokenService = new APITokenService();

const ApiTokensPage = observer(() => {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // router
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();

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
          <div className="flex h-full w-full flex-col py-">
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

            <EmptyStateCompact
              assetKey="token"
              assetClassName="size-20"
              title={t("settings_empty_state.tokens.title")}
              description={t("settings_empty_state.tokens.description")}
              actions={[
                {
                  label: t("settings_empty_state.tokens.cta_primary"),
                  onClick: () => {
                    captureClick({
                      elementName: PROFILE_SETTINGS_TRACKER_ELEMENTS.EMPTY_STATE_ADD_PAT_BUTTON,
                    });
                    setIsCreateTokenModalOpen(true);
                  },
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          </div>
        )}
      </section>
    </div>
  );
});

export default ApiTokensPage;
