"use client";

import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { ENotificationTab } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export const NotificationEmptyState: FC = observer(() => {
  // plane imports
  const { t } = useTranslation();

  return (
    <>
      <EmptyStateCompact
        assetKey="inbox"
        assetClassName="size-24"
        title={
          ENotificationTab.ALL ? t("workspace.inbox_sidebar_all.title") : t("workspace.inbox_sidebar_mentions.title")
        }
        className="max-w-56"
      />
    </>
  );
});
