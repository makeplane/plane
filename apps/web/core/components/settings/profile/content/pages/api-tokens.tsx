import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { APITokenService } from "@plane/services";
// components
import { CreateApiTokenModal } from "@/components/api-token/modal/create-token-modal";
import { ApiTokenListItem } from "@/components/api-token/token-list-item";
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
import { APITokenSettingsLoader } from "@/components/ui/loader/settings/api-token";
// constants
import { API_TOKENS_LIST } from "@/constants/fetch-keys";

const apiTokenService = new APITokenService();

export const APITokensProfileSettings = observer(function APITokensProfileSettings() {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // store hooks
  const { data: tokens } = useSWR(API_TOKENS_LIST, () => apiTokenService.list());
  // translation
  const { t } = useTranslation();

  if (!tokens) {
    return <APITokenSettingsLoader />;
  }

  return (
    <div className="size-full">
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <ProfileSettingsHeading
        title={t("account_settings.api_tokens.heading")}
        description={t("account_settings.api_tokens.description")}
        control={
          <Button variant="primary" size="lg" onClick={() => setIsCreateTokenModalOpen(true)}>
            {t("workspace_settings.settings.api_tokens.add_token")}
          </Button>
        }
      />
      <div className="mt-7">
        {tokens.length > 0 ? (
          <>
            <div>
              {tokens.map((token) => (
                <ApiTokenListItem key={token.id} token={token} />
              ))}
            </div>
          </>
        ) : (
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
            align="start"
            rootClassName="py-20"
          />
        )}
      </div>
    </div>
  );
});
