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

export const CustomThemeSelector: React.FC<Props> = ({ preLoadedData }) => {
  const [darkPalette, setDarkPalette] = useState(false);

  const defaultValues = {
    accent: preLoadedData?.accent ?? "#FE5050",
    bgBase: preLoadedData?.bgBase ?? "#FFF7F7",
    bgSurface1: preLoadedData?.bgSurface1 ?? "#FFE0E0",
    bgSurface2: preLoadedData?.bgSurface2 ?? "#FFF7F7",
    border: preLoadedData?.border ?? "#FFC9C9",
    darkPalette: preLoadedData?.darkPalette ?? false,
    palette: preLoadedData?.palette ?? "",
    sidebar: preLoadedData?.sidebar ?? "#FFFFFF",
    textBase: preLoadedData?.textBase ?? "#430000",
    textSecondary: preLoadedData?.textSecondary ?? "#323232",
  };

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useForm<any>({
    defaultValues,
  });

  const { setTheme } = useTheme();
  const { mutateUser } = useUser();

  const handleFormSubmit = async (formData: any) => {
    await userService
      .updateUser({
        theme: {
          accent: formData.accent,
          bgBase: formData.bgBase,
          bgSurface1: formData.bgSurface1,
          bgSurface2: formData.bgSurface2,
          border: formData.border,
          darkPalette: darkPalette,
          palette: `${formData.bgBase},${formData.bgSurface1},${formData.bgSurface2},${formData.border},${formData.sidebar},${formData.accent},${formData.textBase},${formData.textSecondary}`,
          sidebar: formData.sidebar,
          textBase: formData.textBase,
          textSecondary: formData.textSecondary,
        },
      })
      .then((res) => {
        mutateUser((prevData) => {
          if (!prevData) return prevData;
          return { ...prevData, user: res };
        }, false);
        applyTheme(formData.palette, darkPalette);
        setTheme("custom");
      })
      .catch((err) => console.log(err));
  };

  const handleUpdateTheme = async (formData: any) => {
    await handleFormSubmit({ ...formData, darkPalette });

    reset({
      ...defaultValues,
    });
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
              <h3 className="text-left text-base text-brand-secondary">Background</h3>
              <ColorPickerInput
                name="bgBase"
                error={errors.bgBase}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Background surface 1</h3>
              <ColorPickerInput
                name="bgSurface1"
                error={errors.bgSurface1}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Background surface 2</h3>
              <ColorPickerInput
                name="bgSurface2"
                error={errors.bgSurface2}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Border</h3>
              <ColorPickerInput
                name="border"
                error={errors.border}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Sidebar</h3>
              <ColorPickerInput
                name="sidebar"
                error={errors.sidebar}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Accent</h3>
              <ColorPickerInput
                name="accent"
                error={errors.accent}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Text primary</h3>
              <ColorPickerInput
                name="textBase"
                error={errors.textBase}
                watch={watch}
                setValue={setValue}
                register={register}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-base text-brand-secondary">Text secondary</h3>
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
