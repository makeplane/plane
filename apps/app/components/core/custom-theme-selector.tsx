import React, { useEffect, useState } from "react";

import { useTheme } from "next-themes";

import { useForm } from "react-hook-form";

// hooks
import useUser from "hooks/use-user";
// ui
import { PrimaryButton } from "components/ui";
import { ColorPickerInput } from "components/core";
// services
import userService from "services/user.service";
// helper
import { applyTheme } from "helpers/theme.helper";
// types
import { ICustomTheme } from "types";

type Props = {
  preLoadedData?: Partial<ICustomTheme> | null;
};

const defaultValues = {
  accent: "#fe5050",
  background: "#fff7f7",
  border: "#ffc9c9",
  darkPalette: false,
  palette: "",
  sidebar: "#ffffff",
  textBase: "#430000",
  textSecondary: "#323232",
};

export const CustomThemeSelector: React.FC<Props> = ({ preLoadedData }) => {
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

  const { setTheme } = useTheme();
  const { mutateUser } = useUser();

  const handleFormSubmit = async (formData: ICustomTheme) => {
    const payload: ICustomTheme = {
      accent: formData.accent,
      background: formData.background,
      border: formData.border,
      darkPalette: darkPalette,
      palette: `${formData.background},${formData.border},${formData.sidebar},${formData.accent},${formData.textBase},${formData.textSecondary}`,
      sidebar: formData.sidebar,
      textBase: formData.textBase,
      textSecondary: formData.textSecondary,
    };

    await userService
      .updateUser({
        theme: payload,
      })
      .then((res) => {
        mutateUser((prevData) => {
          if (!prevData) return prevData;

          return { ...prevData, ...res };
        }, false);

        applyTheme(payload.palette, darkPalette);
        setTheme("custom");
      })
      .catch((err) => console.log(err));
  };

  const handleUpdateTheme = async (formData: any) => {
    await handleFormSubmit({ ...formData, darkPalette });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...preLoadedData,
    });
  }, [preLoadedData, reset]);

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-brand-base">Customize your theme</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">
                Background color
              </h3>
              <ColorPickerInput
                name="background"
                error={errors.background}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">Border color</h3>
              <ColorPickerInput
                name="border"
                error={errors.border}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">
                Sidebar background color
              </h3>
              <ColorPickerInput
                name="sidebar"
                error={errors.sidebar}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">Accent color</h3>
              <ColorPickerInput
                name="accent"
                error={errors.accent}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">
                Primary text color
              </h3>
              <ColorPickerInput
                name="textBase"
                error={errors.textBase}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-brand-secondary">
                Secondary text color
              </h3>
              <ColorPickerInput
                name="textSecondary"
                error={errors.textSecondary}
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
};
