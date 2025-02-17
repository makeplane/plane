// plane ui
import { useTranslation } from "@plane/i18n";
import { RecentStickyIcon } from "@plane/ui";

export const StickiesEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[110px] flex w-full justify-center py-6 bg-custom-border-100 rounded">
      <div className="m-auto flex gap-2">
        <RecentStickyIcon className="h-[30px] w-[30px] text-custom-text-400/40" />
        <div className="text-custom-text-400 text-sm text-center my-auto">{t("stickies.empty_state.simple")}</div>
      </div>
    </div>
  );
};
