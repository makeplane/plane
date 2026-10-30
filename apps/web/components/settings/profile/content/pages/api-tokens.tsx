/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { Icon } from "@makeplane/propel/components/icon";
import { InputField } from "@makeplane/propel/components/input-field";
import { SearchOutline } from "@makeplane/propel/icons";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { APITokenService } from "@plane/services";
// components
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokensTable } from "@/components/api-token/tokens-table";
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
// constants
import { API_TOKENS_LIST } from "@plane/constants";

const apiTokenService = new APITokenService();

export const APITokensProfileSettings = observer(function APITokensProfileSettings() {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // store hooks
  const { data: tokens } = useSWR(API_TOKENS_LIST, () => apiTokenService.list());
  // translation
  const { t } = useTranslation();
  // derived values
  const filteredTokens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!tokens || !query) return tokens ?? [];
    return tokens.filter(
      (token) => token.label?.toLowerCase().includes(query) || token.description?.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  return (
    <div className="flex size-full flex-col gap-4">
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <ProfileSettingsHeading
        title={t("account_settings.api_tokens.title")}
        description={t("account_settings.api_tokens.description")}
        control={
          tokens.length === 0 && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("workspace_settings.settings.api_tokens.add_token")}
              onClick={() => setIsCreateTokenModalOpen(true)}
            />
          )
        }
      />
      {/* the toolbar stays while a query is set, so an emptied list can still be cleared */}
      {(tokens.length > 0 || searchQuery !== "") && (
        <div className="flex items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <InputField
              type="search"
              size="lg"
              orientation="vertical"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search.label")}
              aria-label={t("common.search.label")}
              startIcon={<Icon icon={SearchOutline} tint="tertiary" />}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            stretch="auto"
            label={t("workspace_settings.settings.api_tokens.add_token")}
            onClick={() => setIsCreateTokenModalOpen(true)}
          />
        </div>
      )}
      <div>
        {tokens.length === 0 ? (
          <EmptyStateCompact
            assetKey="token"
            assetClassName="size-20"
            title={t("settings_empty_state.tokens.title")}
            description={t("settings_empty_state.tokens.description")}
            actions={[
              {
                label: t("settings_empty_state.tokens.cta_primary"),
                onClick: () => {
                  setIsCreateTokenModalOpen(true);
                },
              },
            ]}
            align="center"
            rootClassName="rounded-lg border border-subtle bg-surface-1 py-10"
          />
        ) : filteredTokens.length === 0 ? (
          <p className="rounded-lg border border-subtle bg-surface-1 py-10 text-center text-body-sm-regular text-tertiary">
            {t("common.search.no_matches_found")}
          </p>
        ) : (
          <ApiTokensTable tokens={filteredTokens} />
        )}
      </div>
    </div>
  );
});
