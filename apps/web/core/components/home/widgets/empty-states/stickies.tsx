import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";

export function StickiesEmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-layer-1 w-full rounded-lg">
      <EmptyStateCompact assetKey="note" assetClassName="size-20" title={t("stickies.empty_state.simple")} />
    </div>
  );
}
