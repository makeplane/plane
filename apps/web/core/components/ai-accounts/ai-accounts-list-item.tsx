/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { mutate } from "swr";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Switch } from "@makeplane/propel/components/switch";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TAIAccount } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { aiAccountService } from "@/services/ai-account.service";
// local imports
import { AI_ACCOUNTS_LIST } from "./constants";
import { DeleteAIAccountModal } from "./delete-account-modal";
import { EditAIAccountModal } from "./edit-account-modal";
import { AIScopesModal } from "./scopes-modal";

type Props = {
  account: TAIAccount;
  workspaceSlug: string;
};

export function AIAccountsListItem(props: Props) {
  const { account, workspaceSlug } = props;
  // states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showScopesModal, setShowScopesModal] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  // hooks
  const { t } = useTranslation();

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await aiAccountService.updateAIAccount(workspaceSlug, account.id, { is_active: !account.is_active });
      mutate<TAIAccount[]>(AI_ACCOUNTS_LIST(workspaceSlug));
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.ai_accounts.toasts.not_updated.title"),
        message: t("workspace_settings.settings.ai_accounts.toasts.not_updated.message"),
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <DeleteAIAccountModal
        account={account}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        workspaceSlug={workspaceSlug}
      />
      <EditAIAccountModal
        account={account}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        workspaceSlug={workspaceSlug}
      />
      <AIScopesModal
        account={account}
        isOpen={showScopesModal}
        onClose={() => setShowScopesModal(false)}
        workspaceSlug={workspaceSlug}
      />
      <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-layer-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar
            src={account.bot_user.avatar_url}
            alt={account.bot_user.display_name}
            fallback={account.bot_user.display_name.charAt(0)}
            size="md"
            tooltip
          />
          <div className="min-w-0">
            <h5 className="truncate text-body-sm-medium">{account.name}</h5>
            <p className="truncate text-11 text-tertiary">{account.bot_user.email}</p>
            {account.description && <p className="truncate text-11 text-placeholder">{account.description}</p>}
            <p className="text-11 text-placeholder">
              {t("workspace_settings.settings.ai_accounts.list.created_on")} {renderFormattedDate(account.created_at)}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowScopesModal(true)}>
            {t("workspace_settings.settings.ai_accounts.list.manage_scopes")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowEditModal(true)}>
            <EditIcon className="size-3" />
            {t("workspace_settings.settings.ai_accounts.list.edit")}
          </Button>
          <Button variant="error-outline" size="sm" onClick={() => setShowDeleteModal(true)}>
            <TrashIcon className="size-3" />
            {t("workspace_settings.settings.ai_accounts.list.delete")}
          </Button>
          <Switch
            size="sm"
            checked={account.is_active}
            onCheckedChange={() => {
              void handleToggle();
            }}
            aria-label={account.name}
          />
        </div>
      </div>
    </>
  );
}
