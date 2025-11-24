import { observer } from "mobx-react";
// plane imports
import { ENotificationTab } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

type TNotificationEmptyStateProps = {
  currentNotificationTab: ENotificationTab;
};

export const NotificationEmptyState = observer(function NotificationEmptyState({
  currentNotificationTab,
}: TNotificationEmptyStateProps) {
  // plane imports
  const { t } = useTranslation();

  return (
    <>
      <EmptyStateCompact
        assetKey="inbox"
        assetClassName="size-24"
        title={
          currentNotificationTab === ENotificationTab.ALL
            ? t("workspace_empty_state.inbox_sidebar_all.title")
            : t("workspace_empty_state.inbox_sidebar_mentions.title")
        }
        className="max-w-56"
      />
    </>
  );
});
