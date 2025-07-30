import React from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useClickUpImporter } from "@/plane-web/hooks/store/importers/use-clickup";

interface SkipAdditionalDataToggleProps {
  skipAdditionalData: boolean;
  handleSkipAdditionalDataToggle: (value: boolean) => void;
  className?: string;
}

export const SkipAdditionalDataToggle: React.FC<SkipAdditionalDataToggleProps> = ({
  skipAdditionalData,
  handleSkipAdditionalDataToggle,
  className = "",
}) => {
  const { handleSyncJobConfig } = useClickUpImporter();
  const handleClick = (value: boolean) => {
    handleSkipAdditionalDataToggle(value);
    // update the sync job config
    handleSyncJobConfig("skipAdditionalDataImport", value);
  };

  const { t } = useTranslation();

  const pullAdditionalData = !skipAdditionalData;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => handleClick(!skipAdditionalData)}>
        <div
          className={cn(
            "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-sm transition-all",
            { "border-custom-primary-100": pullAdditionalData }
          )}
        >
          <div
            className={cn("w-full h-full bg-custom-background-80 transition-all", {
              "bg-custom-primary-100": pullAdditionalData,
            })}
          />
        </div>
        <div className="text-sm text-custom-text-100">{t("clickup_importer.steps.pull_additional_data_title")}</div>
      </div>
    </div>
  );
};
