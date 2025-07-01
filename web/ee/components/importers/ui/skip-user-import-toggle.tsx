import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import React from "react";

interface SkipUserImportProps {
  importSourceName?: string;
  userSkipToggle: boolean;
  handleUserSkipToggle: (value: boolean) => void;
  className?: string;
}

export const SkipUserImport: React.FC<SkipUserImportProps> = ({
  importSourceName = "Jira",
  userSkipToggle,
  handleUserSkipToggle,
  className = "",
}) => {
  const handleClick = (value: boolean) => {
    handleUserSkipToggle(value);
  };

  const { t } = useTranslation();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => handleClick(!userSkipToggle)}>
        <div
          className={cn(
            "flex-shrink-0 w-4 h-4 p-1 relative flex justify-center items-center border border-custom-border-300 overflow-hidden rounded-sm transition-all",
            { "border-custom-primary-100": userSkipToggle }
          )}
        >
          <div
            className={cn("w-full h-full bg-custom-background-80 transition-all", {
              "bg-custom-primary-100": userSkipToggle,
            })}
          />
        </div>
        <div className="text-sm text-custom-text-100">{t("importers.skip_user_import_title")}</div>
      </div>

      {userSkipToggle && (
        <div className="text-sm text-red-500">
          {t("importers.skip_user_import_description", { "serviceName": importSourceName })}
        </div>
      )}
    </div>
  );
};
