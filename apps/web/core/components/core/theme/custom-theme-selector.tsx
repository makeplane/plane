import { useState, useEffect as React_useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// ui
import { InputColorPicker, ToggleSwitch } from "@plane/ui";
import { applyCustomTheme, generateThemePalettes, invertPalette } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";

interface CustomThemeFormData {
  brandColor: string;
  neutralColor: string;
  themeMode: "light" | "dark";
  darkModeLightnessOffset: number;
}

type TCustomThemeSelector = {
  applyThemeChange: (themeData: CustomThemeFormData & { theme: "custom" }) => void;
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
  const getSavedTheme = (): CustomThemeFormData => {
    if (userProfile?.theme) {
      const theme = userProfile.theme;
      if (theme.brandColor && theme.neutralColor) {
        return {
          brandColor: theme.brandColor,
          neutralColor: theme.neutralColor,
          themeMode: theme.themeMode || (theme.isDarkModeToggled ? "dark" : "light"),
          darkModeLightnessOffset: theme.darkModeLightnessOffset || -0.15,
        };
      }
    }
    // Fallback to defaults
    return {
      brandColor: "#3f76ff",
      neutralColor: "#1a1a1a",
      themeMode: "light",
      darkModeLightnessOffset: -0.15,
    };
  };

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    watch,
    setValue,
  } = useForm<CustomThemeFormData>({
    defaultValues: getSavedTheme(),
  });

  const [previewPalettes, setPreviewPalettes] = useState<{
    brandPalette: any;
    neutralPalette: any;
    neutralPaletteDark: any;
  }>(() => {
    const values = getSavedTheme();
    // Initialize with empty palettes, will be loaded async
    return {
      brandPalette: {},
      neutralPalette: {},
      neutralPaletteDark: {},
    };
  });

  // No need for local invertPalette - using the one from @plane/utils

  // Load initial palettes on mount
  React_useEffect(() => {
    const loadInitialPalettes = () => {
      const values = getSavedTheme();
      setIsLoadingPalette(true);
      try {
        const palettes = generateThemePalettes(values.brandColor, values.neutralColor);
        setPreviewPalettes({
          brandPalette: palettes.brandPalette,
          neutralPalette: palettes.neutralPalette,
          neutralPaletteDark: palettes.neutralPalette, // Will be inverted in display
        });
      } catch (error) {
        console.error("Failed to load initial palettes:", error);
      } finally {
        setIsLoadingPalette(false);
      }
    };
    loadInitialPalettes();
  }, []);

  // Watch colors and theme mode for live preview
  const brandColor = watch("brandColor");
  const neutralColor = watch("neutralColor");
  const themeMode = watch("themeMode");
  const darkModeLightnessOffset = watch("darkModeLightnessOffset");

  // Update preview when colors change (no longer depends on themeMode or darkModeLightnessOffset)
  React_useEffect(() => {
    const updatePreview = () => {
      if (brandColor && neutralColor) {
        setIsLoadingPalette(true);
        try {
          const palettes = generateThemePalettes(brandColor, neutralColor);
          setPreviewPalettes({
            brandPalette: palettes.brandPalette,
            neutralPalette: palettes.neutralPalette,
            neutralPaletteDark: palettes.neutralPalette, // Will be inverted in display
          });
        } catch (error) {
          console.error("Failed to generate preview:", error);
        } finally {
          setIsLoadingPalette(false);
        }
      }
    };

    // Debounce the update
    const timeoutId = setTimeout(updatePreview, 300);
    return () => clearTimeout(timeoutId);
  }, [brandColor, neutralColor]);

  const handleUpdateTheme = async (formData: CustomThemeFormData) => {
    try {
      setIsLoadingPalette(true);

      // Apply theme immediately (now synchronous)
      applyCustomTheme(formData.brandColor, formData.neutralColor, formData.themeMode);

      // Generate palettes to save
      const palettes = generateThemePalettes(formData.brandColor, formData.neutralColor);

      // Generate light mode palette (brand + neutral combined)
      const lightModePalette = {
        brand: palettes.brandPalette,
        neutral: palettes.neutralPalette,
      };

      // Generate dark mode palette (inverted neutral palette)
      const darkModeNeutralPalette = invertPalette(palettes.neutralPalette);
      const darkModeBrandPalette = invertPalette(palettes.brandPalette);
      const darkModePalette = {
        brand: darkModeBrandPalette,
        neutral: darkModeNeutralPalette,
      };

      // Save to profile endpoint
      await updateUserTheme({
        theme: "custom",
        brandColor: formData.brandColor,
        neutralColor: formData.neutralColor,
        themeMode: formData.themeMode,
        isDarkModeToggled: formData.themeMode === "dark",
        darkModeLightnessOffset: formData.darkModeLightnessOffset,
        // New palette fields
        brand: JSON.stringify(palettes.brandPalette),
        neutral: JSON.stringify(palettes.neutralPalette),
        // Save light and dark mode full palettes
        palette: JSON.stringify(lightModePalette),
        darkPalette: JSON.stringify(darkModePalette),
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

  const handleValueChange = (val: string | undefined, onChange: any) => {
    let hex = val;
    // prepend a hashtag if it doesn't exist
    if (val && val[0] !== "#") hex = `#${val}`;
    onChange(hex);
    // useEffect will handle preview update with debouncing
  };

  const handleDownloadConfig = () => {
    try {
      const currentValues = watch();
      const config = {
        version: "1.0",
        themeName: "Custom Theme",
        brandColor: currentValues.brandColor,
        neutralColor: currentValues.neutralColor,
        themeMode: currentValues.themeMode,
        darkModeLightnessOffset: currentValues.darkModeLightnessOffset,
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
        message: "Theme configuration downloaded successfully",
      });
    } catch (error) {
      console.error("Failed to download config:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: "Failed to download theme configuration",
      });
    }
  };

  const handleUploadConfig = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Validate required fields
      if (!config.brandColor || !config.neutralColor) {
        throw new Error("Missing required fields: brandColor and neutralColor");
      }

      // Validate hex color format
      const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexPattern.test(config.brandColor)) {
        throw new Error("Invalid brand color hex format");
      }
      if (!hexPattern.test(config.neutralColor)) {
        throw new Error("Invalid neutral color hex format");
      }

      // Validate theme mode
      const themeMode = config.themeMode || "light";
      if (themeMode !== "light" && themeMode !== "dark") {
        throw new Error("Invalid theme mode. Must be 'light' or 'dark'");
      }

      // Validate darkModeLightnessOffset
      const offset = config.darkModeLightnessOffset ?? -0.15;
      if (typeof offset !== "number" || offset < -0.4 || offset > -0.05) {
        throw new Error("Invalid darkModeLightnessOffset. Must be a number between -0.4 and -0.05");
      }

      // Apply the configuration to form
      const formData: CustomThemeFormData = {
        brandColor: config.brandColor,
        neutralColor: config.neutralColor,
        themeMode,
        darkModeLightnessOffset: offset,
      };

      // Update form values
      setValue("brandColor", formData.brandColor);
      setValue("neutralColor", formData.neutralColor);
      setValue("themeMode", formData.themeMode);
      setValue("darkModeLightnessOffset", formData.darkModeLightnessOffset);

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
                  name="brandColor"
                  rules={{
                    required: "Brand color is required",
                    pattern: {
                      value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                      message: "Enter a valid hex code",
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="brandColor"
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
                  name="neutralColor"
                  rules={{
                    required: "Neutral color is required",
                    pattern: {
                      value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                      message: "Enter a valid hex code",
                    },
                  }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="neutralColor"
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
              name="themeMode"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch
                  value={value === "dark"}
                  onChange={(checked) => onChange(checked ? "dark" : "light")}
                  size="sm"
                />
              )}
            />
            <span className="text-12 text-tertiary">{watch("themeMode") === "light" ? "Light Mode" : "Dark Mode"}</span>
          </div>

          {/* Preview Section */}
          <div className="flex flex-col items-start gap-2">
            <h3 className="text-left text-13 font-medium text-secondary">Palette Preview</h3>

            {isLoadingPalette ? (
              <div className="w-full h-24 flex items-center justify-center bg-layer-1 rounded-md">
                <span className="text-13 text-tertiary">Generating palette...</span>
              </div>
            ) : (
              <div className="w-full space-y-3">
                {/* Brand Palette */}
                <div>
                  <p className="text-11 text-tertiary mb-1">Brand Colors</p>
                  <div className="flex gap-1 overflow-x-auto">
                    {Object.entries(previewPalettes.brandPalette).map(([shade, color]) => (
                      <div
                        key={shade}
                        className="flex-shrink-0 h-8 w-8 rounded border border-subtle"
                        style={{ background: String(color) }}
                        title={`${shade}: ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Neutral Palette */}
                <div>
                  <p className="text-11 text-tertiary mb-1">
                    Neutral Colors {themeMode === "dark" && "(Inverted for Dark Mode)"}
                  </p>
                  <div className="flex gap-1 overflow-x-auto">
                    {Object.entries(
                      themeMode === "dark"
                        ? invertPalette(previewPalettes.neutralPalette)
                        : previewPalettes.neutralPalette
                    ).map(([shade, color]) => (
                      <div
                        key={shade}
                        className="flex-shrink-0 h-8 w-8 rounded border border-subtle"
                        style={{ background: String(color) }}
                        title={`${shade}: ${color}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Brand Palette (also show inverted in dark mode) */}
                {themeMode === "dark" && (
                  <div>
                    <p className="text-11 text-tertiary mb-1">Brand Colors (Inverted for Dark Mode)</p>
                    <div className="flex gap-1 overflow-x-auto">
                      {Object.entries(invertPalette(previewPalettes.brandPalette)).map(([shade, color]) => (
                        <div
                          key={shade}
                          className="flex-shrink-0 h-8 w-8 rounded border border-subtle"
                          style={{ background: String(color) }}
                          title={`${shade}: ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        {/* Import/Export Section */}
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadConfig} className="hidden" />
          <Button variant="neutral-primary" type="button" onClick={() => fileInputRef.current?.click()} size="sm">
            Upload Config
          </Button>
          <Button variant="neutral-primary" type="button" onClick={handleDownloadConfig} size="sm">
            Download Config
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
