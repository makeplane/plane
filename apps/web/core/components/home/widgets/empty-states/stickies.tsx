import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export const StickiesEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-custom-background-90 w-full">
      <EmptyStateCompact assetKey="note" assetClassName="size-20" title={t("stickies.empty_state.simple")} />
    </div>
  );
};
