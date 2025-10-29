import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export const LinksEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-custom-background-90 w-full">
      <EmptyStateCompact
        assetKey="link"
        assetClassName="w-20 h-20"
        title={t("workspace_empty_state.home_widget_quick_links.title")}
      />
    </div>
  );
};
