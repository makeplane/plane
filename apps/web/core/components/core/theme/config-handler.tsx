import { useRef } from "react";
import { observer } from "mobx-react";
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";

type Props = {
  getValues: UseFormGetValues<IUserTheme>;
  handleUpdateTheme: (formData: IUserTheme) => Promise<void>;
  setValue: UseFormSetValue<IUserTheme>;
};

export const CustomThemeConfigHandler = observer(function CustomThemeConfigHandler(props: Props) {
  const { getValues, handleUpdateTheme, setValue } = props;
  // refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  // translation
  const { t } = useTranslation();

  const handleDownloadConfig = () => {
    try {
      const currentValues = getValues();
      const config = {
        version: "1.0",
        themeName: "Custom Theme",
        primary: currentValues.primary,
        background: currentValues.background,
        darkPalette: currentValues.darkPalette,
      };

      const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `plane-theme-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: "Theme configuration downloaded successfully.",
      });
    } catch (error) {
      console.error("Failed to download config:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: "Failed to download theme configuration.",
      });
    }
  };

  const handleUploadConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text) as IUserTheme;

      // Validate required fields
      if (!config.primary || !config.background) {
        throw new Error("Missing required fields: primary and background");
      }

      // Validate hex color format
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexPattern.test(config.primary)) {
        throw new Error("Invalid brand color hex format");
      }
      if (!hexPattern.test(config.background)) {
        throw new Error("Invalid neutral color hex format");
      }

      // Validate theme mode
      const themeMode = config.darkPalette ?? false;
      if (typeof themeMode !== "boolean") {
        throw new Error("Invalid theme mode. Must be a boolean");
      }

      // Apply the configuration to form
      const formData: IUserTheme = {
        theme: "custom",
        primary: config.primary,
        background: config.background,
        darkPalette: themeMode,
      };

      // Update form values
      setValue("primary", formData.primary);
      setValue("background", formData.background);
      setValue("darkPalette", formData.darkPalette);
      setValue("theme", "custom");

      // Apply the theme
      await handleUpdateTheme(formData);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: "Theme configuration imported successfully",
      });
    } catch (error) {
      console.error("Failed to upload config:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: error instanceof Error ? error.message : "Failed to import theme configuration",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex gap-2">
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadConfig} className="hidden" />
      <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
        Import config
      </Button>
      <Button variant="secondary" type="button" onClick={handleDownloadConfig}>
        Download config
      </Button>
    </div>
  );
});
