import React, { useEffect, useState } from "react";

import { useTheme } from "next-themes";

import { useForm } from "react-hook-form";

// ui
import { PrimaryButton } from "components/ui";
import { ColorPickerInput } from "components/core";
// types
import { ICustomTheme } from "types";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {
  preLoadedData?: Partial<ICustomTheme> | null;
};

const defaultValues: ICustomTheme = {
  background: "#0d101b",
  text: "#c5c5c5",
  primary: "#3f76ff",
  sidebarBackground: "#0d101b",
  sidebarText: "#c5c5c5",
  darkPalette: false,
  palette: "",
  theme: "custom",
};

export const CustomThemeSelector: React.FC<Props> = observer(({ preLoadedData }) => {
  const store: any = useMobxStore();
  const { setTheme } = useTheme();

  const [darkPalette, setDarkPalette] = useState(false);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<ICustomTheme>({
    defaultValues,
  });
  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
    });
  }, [preLoadedData, reset]);

  const handleUpdateTheme = async (formData: any) => {
    const payload: ICustomTheme = {
      background: formData.background,
      text: formData.text,
      primary: formData.primary,
      sidebarBackground: formData.sidebarBackground,
      sidebarText: formData.sidebarText,
      darkPalette: darkPalette,
      palette: `${formData.background},${formData.text},${formData.primary},${formData.sidebarBackground},${formData.sidebarText}`,
      theme: "custom",
    };

    setTheme("custom");

    return store.user
      .updateCurrentUserSettings({ theme: payload })
      .then((response: any) => response)
      .catch((error: any) => error);
  };

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-custom-text-100">Customize your theme</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">
                Background color
              </h3>
              <ColorPickerInput
                name="background"
                position="right"
                error={errors.background}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Text color</h3>
              <ColorPickerInput
                name="text"
                error={errors.text}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">
                Primary(Theme) color
              </h3>
              <ColorPickerInput
                name="primary"
                error={errors.primary}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">
                Sidebar background color
              </h3>
              <ColorPickerInput
                name="sidebarBackground"
                position="right"
                error={errors.sidebarBackground}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">
                Sidebar text color
              </h3>
              <ColorPickerInput
                name="sidebarText"
                error={errors.sidebarText}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <PrimaryButton type="submit" loading={isSubmitting}>
          {isSubmitting ? "Creating Theme..." : "Set Theme"}
        </PrimaryButton>
      </div>
    </form>
  );
});
