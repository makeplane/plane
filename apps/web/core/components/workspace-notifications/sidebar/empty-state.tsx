"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { ENotificationTab } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { SimpleEmptyState } from "@/components/empty-state";
// constants
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

export const NotificationEmptyState: FC = observer(() => {
  // plane imports
  const { t } = useTranslation();
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/search/notification" });

  return (
    <>
      {ENotificationTab.ALL ? (
        <SimpleEmptyState
          title={t("notification.empty_state.all.title")}
          description={t("notification.empty_state.all.description")}
          assetPath={resolvedPath}
        />
      ) : (
        <SimpleEmptyState
          title={t("notification.empty_state.mentions.title")}
          description={t("notification.empty_state.mentions.description")}
          assetPath={resolvedPath}
        />
      )}
    </>
  );
});
