import { observer } from "mobx-react";
import Image from "next/image";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
// package.json
import packageJson from "package.json";

export const ProductUpdatesHeader = observer(() => {
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
      <div className="flex flex-shrink-0 items-center gap-8">
        <Image src={PlaneLogo} alt="Plane" width={24} height={24} />
      </div>
    </div>
  );
});
