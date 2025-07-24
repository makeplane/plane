import React from "react";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { useClickUpImporter } from "@/plane-web/hooks/store/importers/use-clickup";

interface PullAdditionalDataToggleProps {
  pullAdditionData: boolean;
  handlePullAdditionalDataToggle: (value: boolean) => void;
  className?: string;
}

export const PullAdditionalDataToggle: React.FC<PullAdditionalDataToggleProps> = ({
  pullAdditionData,
  handlePullAdditionalDataToggle,
  className = "",
}) => {
  const { handleSyncJobConfig } = useClickUpImporter();
  const handleClick = (value: boolean) => {
    handlePullAdditionalDataToggle(value);
    // update the sync job config
    handleSyncJobConfig("pullAdditionalData", value);
  };

  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => handleClick(!pullAdditionData)}>
        <div
          className={cn(
            "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-sm transition-all",
            { "border-custom-primary-100": pullAdditionData }
          )}
        >
          <div
            className={cn("w-full h-full bg-custom-background-80 transition-all", {
              "bg-custom-primary-100": pullAdditionData,
            })}
          />
        </div>
        <div className="text-sm text-custom-text-100">{t("clickup_importer.steps.pull_additional_data_title")}</div>
      </div>
    </div>
  );
};
