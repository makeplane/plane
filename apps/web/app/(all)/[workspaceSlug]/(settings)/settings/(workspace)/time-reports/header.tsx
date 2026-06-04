import { Breadcrumbs } from "@plane/ui";
import { useTranslation } from "@plane/i18n";

export const TimeReportsWorkspaceSettingsHeader = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Breadcrumbs>
        <Breadcrumbs.Item
          component={
            <span className="text-sm font-medium text-custom-text-100 px-2 py-1">
              Time Reports
            </span>
          }
        />
      </Breadcrumbs>
    </div>
  );
};
