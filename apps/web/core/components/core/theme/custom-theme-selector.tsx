import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";
import { InputColorPicker, ToggleSwitch } from "@plane/ui";
import { applyCustomTheme } from "@plane/utils";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { CustomThemeConfigHandler } from "./config-handler";

export const CustomThemeSelector = observer(function CustomThemeSelector() {
  // store hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();
  // translation
  const { t } = useTranslation();

  // Loading state for async palette generation
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);

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
      applyCustomTheme(formData.primary, formData.background, formData.darkPalette ? "dark" : "light");
      // Save to profile endpoint
      await updateUserTheme({
        theme: "custom",
        primary: formData.primary,
        background: formData.background,
        darkPalette: formData.darkPalette,
      });

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: "Reloading to apply changes...",
      });
      // reload the page after showing the toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
              <h3 className="text-left text-13 font-medium text-secondary">Brand color</h3>
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
                      className="w-full placeholder:text-placeholder"
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
              <h3 className="text-left text-13 font-medium text-secondary">Neutral color</h3>
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
                      className="w-full placeholder:text-placeholder"
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
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        {/* Import/Export Section */}
        <CustomThemeConfigHandler getValues={getValues} handleUpdateTheme={handleUpdateTheme} setValue={setValue} />

        <div className="flex items-center gap-4">
          {/* Theme Mode Toggle */}
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="darkPalette"
              render={({ field: { value, onChange } }) => (
                <ToggleSwitch value={!!value} onChange={onChange} size="sm" />
              )}
            />
            <span className="text-12 text-tertiary">{watch("darkPalette") ? "Dark mode" : "Light mode"}</span>
          </div>
          {/* Save Theme Button */}
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting || isLoadingPalette}>
            {isSubmitting ? t("creating_theme") : isLoadingPalette ? "Generating..." : t("set_theme")}
          </Button>
        </div>
      </div>
    </form>
  );
});
