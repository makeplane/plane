import { useTranslation } from "@plane/i18n";
import { EmptyState, LinkHorizontalStackIllustration } from "@plane/propel/empty-state";

export const LinksEmptyState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 bg-custom-background-90 w-full">
      <EmptyState
        asset={<LinkHorizontalStackIllustration className="w-20 h-20" />}
        description={t("workspace.home_widget_quick_links.title")}
        type="simple"
      />
    </div>
  );
};
