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
        <div className="flex gap-2 text-18 font-medium">{t("whats_new")}</div>
        <div
          className={cn(
            "px-2 mx-2 py-0.5 text-center text-11 font-medium rounded-full bg-accent-primary/20 text-accent-primary"
          )}
        >
          {t("version")}: v{packageJson.version}
        </div>
      </div>
    </div>
  );
});
