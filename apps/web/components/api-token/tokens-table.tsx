/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { InfoOutline, MoreHorizontalOutline, DeleteOutline } from "@makeplane/propel/icons";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@makeplane/propel/components/menu";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import type { IApiToken } from "@plane/types";
import { cn, renderFormattedDate } from "@plane/utils";
// components
import { DeleteApiTokenModal } from "@/components/api-token/delete-token-modal";
import type { DataTableColumn } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";

/** The row's "…" menu; deleting goes through the confirmation modal. */
function ApiTokenQuickActions({ token }: { token: IApiToken }) {
  const { t } = useTranslation();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <>
      <DeleteApiTokenModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} tokenId={token.id} />
      <Menu>
        <MenuTrigger
          render={
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={t("aria_labels.common.more_actions")}
              icon={<Icon icon={MoreHorizontalOutline} />}
            />
          }
        />
        <MenuContent side="bottom" align="end">
          <MenuItem
            variant="danger"
            icon={<Icon icon={DeleteOutline} />}
            label={t("common.delete")}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </MenuContent>
      </Menu>
    </>
  );
}

type Props = {
  tokens: IApiToken[];
};

/** Personal access tokens as a table: name, status, created, expiry, last use and actions. */
export function ApiTokensTable({ tokens }: Props) {
  const { t } = useTranslation();

  const columns: DataTableColumn<IApiToken>[] = [
    {
      key: "label",
      content: t("name"),
      tdRender: (token) => {
        const description = token.description?.trim();
        return (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-body-xs-regular text-primary">{token.label}</span>
            {description && (
              <Tooltip label={description}>
                {/* focusable, since the description is only reachable through this tooltip */}
                <IconButton
                  variant="ghost"
                  size="xs"
                  icon={<Icon icon={InfoOutline} size="sm" tint="tertiary" />}
                  aria-label={description}
                  showTooltip={false}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      content: t("common.status"),
      tdRender: (token) => (
        <Badge
          variant={token.is_active ? "success" : "warning"}
          size="xs"
          label={token.is_active ? t("common.active") : t("workspace_settings.settings.api_tokens.expired")}
        />
      ),
    },
    {
      key: "created_at",
      content: t("created"),
      tdRender: (token) => (
        <span className="text-body-xs-regular text-primary">{renderFormattedDate(token.created_at)}</span>
      ),
    },
    {
      key: "expired_at",
      content: t("workspace_settings.settings.api_tokens.columns.expires"),
      tdRender: (token) => (
        <span className="text-body-xs-regular text-primary">
          {token.expired_at
            ? renderFormattedDate(token.expired_at)
            : t("workspace_settings.settings.api_tokens.never_expires")}
        </span>
      ),
    },
    {
      key: "last_used",
      content: t("workspace_settings.settings.api_tokens.columns.last_used"),
      tdRender: (token) => (
        <span className={cn("text-body-xs-regular", token.last_used ? "text-primary" : "text-tertiary")}>
          {token.last_used
            ? renderFormattedDate(token.last_used)
            : t("workspace_settings.settings.api_tokens.not_used_yet")}
        </span>
      ),
    },
    {
      key: "actions",
      content: "",
      padding: "trigger",
      tdRender: (token) => (
        <div className="flex justify-end px-2">
          <ApiTokenQuickActions token={token} />
        </div>
      ),
    },
  ];

  return <DataTable<IApiToken> columns={columns} data={tokens} keyExtractor={(token) => token.id} />;
}
