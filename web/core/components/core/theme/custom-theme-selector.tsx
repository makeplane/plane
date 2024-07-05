"use client";

import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// types
import { IUserTheme } from "@plane/types";
// ui
import { Button, InputColorPicker, setPromiseToast } from "@plane/ui";
// hooks
import { useUserProfile } from "@/hooks/store";

const inputRules = {
  minLength: {
    value: 7,
    message: "Enter a valid hex code of 6 characters",
  },
  maxLength: {
    value: 7,
    message: "Enter a valid hex code of 6 characters",
  },
  pattern: {
    value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
    message: "Enter a valid hex code of 6 characters",
  },
};

type TCustomThemeSelector = {
  applyThemeChange: (theme: Partial<IUserTheme>) => void;
};

export const CustomThemeSelector: React.FC<TCustomThemeSelector> = observer((props) => {
  const { applyThemeChange } = props;
  // hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<IUserTheme>({
    defaultValues: {
      background: userProfile?.theme?.background !== "" ? userProfile?.theme?.background : "#0d101b",
      text: userProfile?.theme?.text !== "" ? userProfile?.theme?.text : "#c5c5c5",
      primary: userProfile?.theme?.primary !== "" ? userProfile?.theme?.primary : "#3f76ff",
      sidebarBackground:
        userProfile?.theme?.sidebarBackground !== "" ? userProfile?.theme?.sidebarBackground : "#0d101b",
      sidebarText: userProfile?.theme?.sidebarText !== "" ? userProfile?.theme?.sidebarText : "#c5c5c5",
      darkPalette: userProfile?.theme?.darkPalette || false,
      palette: userProfile?.theme?.palette !== "" ? userProfile?.theme?.palette : "",
    },
  });

  const handleUpdateTheme = async (formData: Partial<IUserTheme>) => {
    const payload: IUserTheme = {
      background: formData.background,
      text: formData.text,
      primary: formData.primary,
      sidebarBackground: formData.sidebarBackground,
      sidebarText: formData.sidebarText,
      darkPalette: false,
      palette: `${formData.background},${formData.text},${formData.primary},${formData.sidebarBackground},${formData.sidebarText}`,
      theme: "custom",
    };
    applyThemeChange(payload);

    const updateCurrentUserThemePromise = updateUserTheme(payload);
    setPromiseToast(updateCurrentUserThemePromise, {
      loading: "Updating theme...",
      success: {
        title: "Success!",
        message: () => "Theme updated successfully!",
      },
      error: {
        title: "Error!",
        message: () => "Failed to Update the theme",
      },
    });

    return;
  };

  const handleValueChange = (val: string | undefined, onChange: any) => {
    let hex = val;
    // prepend a hashtag if it doesn't exist
    if (val && val[0] !== "#") hex = `#${val}`;

    onChange(hex);
  };

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-custom-text-100">Customize your theme</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Background color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="background"
                  rules={{ ...inputRules, required: "Background color is required" }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="background"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#0d101b"
                      className="w-full placeholder:text-custom-text-400/60"
                      style={{
                        backgroundColor: watch("background"),
                        color: watch("text"),
                      }}
                      hasError={Boolean(errors?.background)}
                    />
                  )}
                />
                {errors.background && <p className="mt-1 text-xs text-red-500">{errors.background.message}</p>}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Text color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="text"
                  rules={{ ...inputRules, required: "Text color is required" }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="text"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#c5c5c5"
                      className="w-full placeholder:text-custom-text-400/60"
                      style={{
                        backgroundColor: watch("text"),
                        color: watch("background"),
                      }}
                      hasError={Boolean(errors?.text)}
                    />
                  )}
                />
                {errors.text && <p className="mt-1 text-xs text-red-500">{errors.text.message}</p>}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Primary(Theme) color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="primary"
                  rules={{ ...inputRules, required: "Primary color is required" }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="primary"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#3f76ff"
                      className="w-full placeholder:text-custom-text-400/60"
                      style={{
                        backgroundColor: watch("primary"),
                        color: watch("text"),
                      }}
                      hasError={Boolean(errors?.primary)}
                    />
                  )}
                />
                {errors.primary && <p className="mt-1 text-xs text-red-500">{errors.primary.message}</p>}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Sidebar background color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="sidebarBackground"
                  rules={{ ...inputRules, required: "Sidebar background color is required" }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="sidebarBackground"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#0d101b"
                      className="w-full placeholder:text-custom-text-400/60"
                      style={{
                        backgroundColor: watch("sidebarBackground"),
                        color: watch("sidebarText"),
                      }}
                      hasError={Boolean(errors?.sidebarBackground)}
                    />
                  )}
                />
                {errors.sidebarBackground && (
                  <p className="mt-1 text-xs text-red-500">{errors.sidebarBackground.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Sidebar text color</h3>
              <div className="w-full">
                <Controller
                  control={control}
                  name="sidebarText"
                  rules={{ ...inputRules, required: "Sidebar text color is required" }}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="sidebarText"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#c5c5c5"
                      className="w-full placeholder:text-custom-text-400/60"
                      style={{
                        backgroundColor: watch("sidebarText"),
                        color: watch("sidebarBackground"),
                      }}
                      hasError={Boolean(errors?.sidebarText)}
                    />
                  )}
                />
                {errors.sidebarText && <p className="mt-1 text-xs text-red-500">{errors.sidebarText.message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creating Theme..." : "Set Theme"}
        </Button>
      </div>
    </form>
  );
});
