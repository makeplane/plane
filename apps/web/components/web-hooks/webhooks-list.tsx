/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  DeleteOutline,
  EditOutline,
  MoreHorizontalOutline,
  ToggleOffOutline,
  ToggleOnOutline,
} from "@makeplane/propel/icons";
// plane imports
import { Badge } from "@makeplane/propel/components/badge";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@makeplane/propel/components/menu";
import { useTranslation } from "@plane/i18n";
import type { IWebhook } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// components
import type { DataTableColumn } from "@/components/common/data-table";
import { DataTable } from "@/components/common/data-table";
// hooks
import { useWebhook } from "@/hooks/store/use-webhook";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { DeleteWebhookModal } from "./delete-webhook-modal";

/** A webhook row's "…" menu: edit, enable or disable, and delete behind a confirmation. */
const WebhookQuickActions = observer(function WebhookQuickActions(props: { workspaceSlug: string; webhook: IWebhook }) {
  const { workspaceSlug, webhook } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // router
  const router = useAppRouter();
  // store hooks
  const { updateWebhook } = useWebhook();

  return (
    <>
      <DeleteWebhookModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        webhookId={webhook.id}
      />
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
            icon={<Icon icon={EditOutline} />}
            label={t("common.actions.edit")}
            onClick={() => router.push(`/${workspaceSlug}/settings/webhooks/${webhook.id}`)}
          />
          <MenuItem
            icon={<Icon icon={webhook.is_active ? ToggleOffOutline : ToggleOnOutline} />}
            label={webhook.is_active ? t("common.actions.disable") : t("common.actions.enable")}
            onClick={() => void updateWebhook(workspaceSlug, webhook.id, { is_active: !webhook.is_active })}
          />
          <MenuSeparator />
          <MenuItem
            variant="danger"
            icon={<Icon icon={DeleteOutline} />}
            label={t("common.actions.delete")}
            onClick={() => setIsDeleteModalOpen(true)}
          />
        </MenuContent>
      </Menu>
    </>
  );
});

export const WebhooksList = observer(function WebhooksList() {
  // router
  const { workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { webhooks } = useWebhook();
  // derived values
  const slug = workspaceSlug?.toString() ?? "";

  const columns: DataTableColumn<IWebhook>[] = [
    {
      key: "url",
      content: t("common.url"),
      tdRender: (webhook) => (
        <Link
          href={`/${slug}/settings/webhooks/${webhook.id}`}
          className="block max-w-[450px] truncate text-body-xs-regular text-primary hover:underline"
        >
          {webhook.url}
        </Link>
      ),
    },
    {
      key: "status",
      content: t("common.status"),
      tdRender: (webhook) =>
        webhook.is_active ? (
          <Badge variant="success" size="xs" label={t("common.active")} />
        ) : (
          <Badge variant="neutral" size="xs" label={t("common.disabled")} />
        ),
    },
    {
      key: "created_at",
      content: t("created"),
      tdRender: (webhook) => (
        <span className="text-body-xs-regular text-primary">{renderFormattedDate(webhook.created_at)}</span>
      ),
    },
    {
      key: "actions",
      content: "",
      padding: "trigger",
      tdRender: (webhook) => (
        <div className="flex justify-end px-2">
          <WebhookQuickActions workspaceSlug={slug} webhook={webhook} />
        </div>
      ),
    },
  ];

  return (
    <DataTable<IWebhook>
      columns={columns}
      data={Object.values(webhooks ?? {})}
      keyExtractor={(webhook) => webhook.id}
    />
  );
});
