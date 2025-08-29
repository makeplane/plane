import { LayersIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";

export const IssueTypePropertiesEmptyState = () => {
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full px-3 py-1 relative flex justify-center items-center">
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 grid h-24 w-24 place-items-center rounded-full bg-custom-background-90 mb-4">
          <LayersIcon className="h-14 w-14 text-custom-text-400" strokeWidth="1.5" />
        </div>
        <div className="text-custom-text-100 font-medium">
          {t("work_item_types.settings.properties.empty_state.title")}
        </div>
        <div className="text-sm text-custom-text-300">
          {t("work_item_types.settings.properties.empty_state.description")}
        </div>
      </div>
    </div>
  );
};
