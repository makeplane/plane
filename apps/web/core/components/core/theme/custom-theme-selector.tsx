import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";
import { applyCustomTheme } from "@plane/utils";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { CustomThemeColorInputs } from "./color-inputs";
import { CustomThemeDownloadConfigButton } from "./download-config-button";
import { CustomThemeImportConfigButton } from "./import-config-button";
import { CustomThemeModeSelector } from "./theme-mode-selector";

export const CustomThemeSelector = observer(function CustomThemeSelector() {
  // store hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();
  // translation
  const { t } = useTranslation();

  // Loading state for async palette generation
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);

  // Load saved theme from userProfile (fallback to defaults)
  const savedTheme = useMemo((): IUserTheme => {
    const theme = userProfile?.theme;
    if (theme && theme.primary && theme.background) {
      return {
        theme: "custom",
        primary: theme.primary,
        background: theme.background,
        darkPalette: !!theme.darkPalette,
      };
    }

    // Fallback to defaults
    return {
      theme: "custom",
      primary: "#3f76ff",
      background: "#1a1a1a",
      darkPalette: false,
    };
  }, [userProfile?.theme]);

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    getValues,
    setValue,
  } = useForm<IUserTheme>({
    defaultValues: savedTheme,
  });

  const handleUpdateTheme = async (formData: IUserTheme) => {
    if (!formData.primary || !formData.background) return;

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

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleUpdateTheme)(e);
      }}
      className="bg-layer-1 border border-subtle rounded-lg py-3 px-4"
    >
      <div className="space-y-5">
        <ProfileSettingsHeading
          title={t("customize_your_theme")}
          control={<CustomThemeImportConfigButton handleUpdateTheme={handleUpdateTheme} setValue={setValue} />}
        />
        <CustomThemeModeSelector control={control} />
        {/* Color Inputs */}
        <CustomThemeColorInputs control={control} />
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        {/* Save Theme Button */}
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting || isLoadingPalette}>
          {isSubmitting ? t("creating_theme") : isLoadingPalette ? "Generating" : t("set_theme")}
        </Button>
        {/* Import/Export Section */}
        <CustomThemeDownloadConfigButton getValues={getValues} />
      </div>
    </form>
  );
});
