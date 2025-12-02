import { observer } from "mobx-react";
import packageJson from "package.json";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";

export const ProductUpdatesHeader = observer(function ProductUpdatesHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 mx-6 my-4 items-center justify-between flex-shrink-0">
      <div className="flex w-full items-center">
        <div className="flex gap-2 text-xl font-medium">{t("whats_new")}</div>
        <div
          className={cn(
            "px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100"
          )}
        >
          {t("version")}: v{packageJson.version}
        </div>
      </div>
    </div>
  );
});
