// plane ui
import { useTranslation } from "@plane/i18n";
import { EmptyState, NoteHorizontalStackIllustration } from "@plane/propel/empty-state";

export const StickiesEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-custom-background-90 w-full">
      <EmptyState
        asset={<NoteHorizontalStackIllustration className="size-20" />}
        description={t("stickies.empty_state.simple")}
        type="simple"
      />
    </div>
  );
};
