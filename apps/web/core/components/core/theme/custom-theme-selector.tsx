import { useState, useRef } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { InputColorPicker, ToggleSwitch } from "@plane/ui";
import { applyCustomTheme } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import type { IUserTheme } from "@plane/types";

type TCustomThemeSelector = {
  applyThemeChange: (themeData: IUserTheme & { theme: "custom" }) => void;
};

export const CustomThemeSelector = observer(function CustomThemeSelector(props: TCustomThemeSelector) {
  const { applyThemeChange } = props;
  const { t } = useTranslation();
  const { data: userProfile, updateUserTheme } = useUserProfile();

  // Loading state for async palette generation
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);

  // File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved theme from userProfile (fallback to defaults)
  const getSavedTheme = (): IUserTheme => {
    if (userProfile?.theme) {
      const theme = userProfile.theme;
      if (theme.primary && theme.background && theme.darkPalette !== undefined) {
        return {
          theme: "custom",
          primary: theme.primary,
          background: theme.background,
          darkPalette: theme.darkPalette,
        };
      }
    }
    // Fallback to defaults
    return {
      theme: "custom",
      primary: "#3f76ff",
      background: "#1a1a1a",
      darkPalette: false,
    };
  };

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    getValues,
    watch,
    setValue,
  } = useForm<IUserTheme>({
    defaultValues: getSavedTheme(),
  });

  const handleUpdateTheme = async (formData: IUserTheme) => {
    if (!formData.primary || !formData.background || formData.darkPalette === undefined) return;

    try {
      setIsLoadingPalette(true);

      // Apply theme immediately (now synchronous)
      applyCustomTheme(formData.primary, formData.background, formData.darkPalette ? "dark" : "light");

      // Save to profile endpoint
      await updateUserTheme({
        theme: "custom",
        primary: formData.primary,
        background: formData.background,
        darkPalette: formData.darkPalette,
      });

      // Notify parent component
      applyThemeChange({ ...formData, theme: "custom" });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: t("theme_updated_successfully"),
      });
    } catch (error) {
      console.error("Failed to apply theme:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_update_the_theme"),
      });
    } finally {
      setIsLoadingPalette(false);
    }
  };

  const handleValueChange = (val: string | undefined, onChange: (...args: unknown[]) => void) => {
    let hex = val;
    // prepend a hashtag if it doesn't exist
    if (val && val[0] !== "#") hex = `#${val}`;
    onChange(hex);
    // useEffect will handle preview update with debouncing
  };

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
        throw new Error("Invalid theme mode. Must be 'light' or 'dark'");
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
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-16 font-semibold text-primary">{t("customize_your_theme")}</h3>

        <div className="space-y-4">
          {/* Color Inputs */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {/* Brand Color */}
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-13 font-medium text-secondary">Brand Color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="primary"
                  rules={{
                    required: "Brand color is required",
                    pattern: {
                      value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                      message: "Enter a valid hex code",
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="primary"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#3f76ff"
                      className="w-full placeholder:text-placeholder/60"
                      style={{
                        backgroundColor: value,
                        color: "#ffffff",
                      }}
                      hasError={false}
                    />
                  )}
                />
              </div>
            </div>

            {/* Neutral Color */}
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-13 font-medium text-secondary">Neutral Color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="background"
                  rules={{
                    required: "Neutral color is required",
                    pattern: {
                      value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                      message: "Enter a valid hex code",
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="background"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#1a1a1a"
                      className="w-full placeholder:text-placeholder/60"
                      style={{
                        backgroundColor: value,
                        color: "#ffffff",
                      }}
                      hasError={false}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Theme Mode Toggle */}
          <div className="flex flex-col items-start gap-2">
            <h3 className="text-left text-13 font-medium text-secondary">Theme Mode</h3>
            <Controller
              control={control}
              name="darkPalette"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
              )}
            />
            <span className="text-12 text-tertiary">{watch("darkPalette") ? "Dark mode" : "Light mode"}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        {/* Import/Export Section */}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadConfig} className="hidden" />
          <Button variant="secondary" type="button" onClick={() => fileInputRef.current?.click()} size="sm">
            Upload config
          </Button>
          <Button variant="secondary" type="button" onClick={handleDownloadConfig} size="sm">
            Download config
          </Button>
        </div>

        {/* Save Theme Button */}
        <Button variant="primary" type="submit" loading={isSubmitting || isLoadingPalette}>
          {isSubmitting ? t("creating_theme") : isLoadingPalette ? "Generating..." : t("set_theme")}
        </Button>
      </div>
    </form>
  );
});
