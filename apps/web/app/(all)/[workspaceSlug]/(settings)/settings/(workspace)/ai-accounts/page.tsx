/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { AIAccountsList, CreateAIAccountModal } from "@/components/ai-accounts";
import { AI_ACCOUNTS_LIST } from "@/components/ai-accounts/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { AIAccountSettingsLoader } from "@/components/ui/loader/settings/ai-account";
import { aiAccountService } from "@/services/ai-account.service";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { AIAccountsWorkspaceSettingsHeader } from "./header";

function AIAccountsListPage({ params }: Route.ComponentProps) {
  // states
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  // router
  const { workspaceSlug } = params;
  // plane hooks
  const { t } = useTranslation();
  // mobx store
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  // derived values
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { data: accounts, isLoading } = useSWR(
    canPerformWorkspaceAdminActions ? AI_ACCOUNTS_LIST(workspaceSlug) : null,
    canPerformWorkspaceAdminActions ? () => aiAccountService.fetchAIAccountsList(workspaceSlug) : null
  );

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.ai_accounts.title")}`
    : undefined;

  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<AIAccountsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full">
        <CreateAIAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
          workspaceSlug={workspaceSlug}
        />
        <SettingsHeading
          title={t("workspace_settings.settings.ai_accounts.title")}
          description={t("workspace_settings.settings.ai_accounts.description")}
          control={
            <Button variant="primary" size="lg" onClick={() => setShowCreateAccountModal(true)}>
              {t("workspace_settings.settings.ai_accounts.add_account")}
            </Button>
          }
        />
        {isLoading || !accounts ? (
          <div className="mt-4">
            <AIAccountSettingsLoader />
          </div>
        ) : accounts.length > 0 ? (
          <div className="mt-4">
            <AIAccountsList accounts={accounts} workspaceSlug={workspaceSlug} />
          </div>
        ) : (
          <div className="flex h-full w-full flex-col">
            <div className="flex h-full w-full items-center justify-center">
              <EmptyStateCompact
                assetKey="token"
                title={t("settings_empty_state.ai_accounts.title")}
                description={t("settings_empty_state.ai_accounts.description")}
                actions={[
                  {
                    label: t("settings_empty_state.ai_accounts.cta_primary"),
                    onClick: () => {
                      setShowCreateAccountModal(true);
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

export default observer(AIAccountsListPage);
