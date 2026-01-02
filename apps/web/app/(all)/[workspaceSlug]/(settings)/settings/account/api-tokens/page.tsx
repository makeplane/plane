import { useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
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
import { useWorkspace } from "@/hooks/store/use-workspace";

const apiTokenService = new APITokenService();

const ApiTokensPage: FC = observer(function ApiTokensPage() {
  // states
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();

  const { data: tokens } = useSWR(API_TOKENS_LIST, () => apiTokenService.list());

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("account_settings.api_tokens.title")}`
    : undefined;

  if (!tokens) {
    return <APITokenSettingsLoader title={t("account_settings.api_tokens.title")} />;
  }

  return (
    <div className="w-full">
      <PageHead title={pageTitle} />
      <CreateApiTokenModal isOpen={isCreateTokenModalOpen} onClose={() => setIsCreateTokenModalOpen(false)} />
      <section className="w-full">
        <SettingsHeading
          title={t("account_settings.api_tokens.heading")}
          description={t("account_settings.api_tokens.description")}
          button={{
            label: t("workspace_settings.settings.api_tokens.add_token"),
            onClick: () => {
              setIsCreateTokenModalOpen(true);
            },
          }}
        />
        {tokens.length > 0 ? (
          <>
            {tokens.map((token) => (
              <ApiTokenListItem key={token.id} token={token} />
            ))}
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
      </section>
    </div>
  );
});

export default ApiTokensPage;
