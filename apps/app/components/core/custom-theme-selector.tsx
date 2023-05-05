import React, { useEffect, useState } from "react";

import { useTheme } from "next-themes";

import { useForm } from "react-hook-form";

// hooks
import useUser from "hooks/use-user";
// ui
import { Input, PrimaryButton } from "components/ui";
// services
import userService from "services/user.service";
// helper
import { applyTheme } from "helpers/theme.helper";
// types
import { ICustomTheme } from "types";

const defaultValues = {
  palette: "",
};

type Props = {
  data?: ICustomTheme | null;
  preLoadedData?: Partial<ICustomTheme> | null;
};

export const CustomThemeSelector: React.FC<Props> = ({ data, preLoadedData }) => {
  const [darkPalette, setDarkPalette] = useState(false);

  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
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
          palette: `${formData.accent},${formData.bgBase},${formData.bgSurface1},${formData.bgSurface2},${formData.border},${formData.sidebar},${formData.textBase},${formData.textSecondary}`,
          sidebar: formData.sidebar,
          textBase: formData.textBase,
          textSecondary: formData.textSecondary,
        },
      })
      .then(() => {
        mutateUser();
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
      ...data,
    });
  }, [data, preLoadedData, reset]);

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-brand-base">Customize your theme</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Background</h3>
              <Input
                id="bgBase"
                name="bgBase"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.bgBase}
                register={register}
                validations={{
                  required: "Background color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Background color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Background surface 1</h3>
              <Input
                id="bgSurface1"
                name="bgSurface1"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.bgSurface1}
                register={register}
                validations={{
                  required: "Background surface 1 color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Background surface 1 color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Background surface 2</h3>
              <Input
                id="bgSurface2"
                name="bgSurface2"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.bgSurface1}
                register={register}
                validations={{
                  required: "Background surface 2 color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Background surface 2 color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Border</h3>
              <Input
                id="border"
                name="border"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.border}
                register={register}
                validations={{
                  required: "Border color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Border color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Sidebar</h3>
              <Input
                id="sidebar"
                name="sidebar"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.sidebar}
                register={register}
                validations={{
                  required: "Sidebar color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Sidebar color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Accent</h3>
              <Input
                id="accent"
                name="accent"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.accent}
                register={register}
                validations={{
                  required: "Accent color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Accent color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Text primary</h3>
              <Input
                id="textBase"
                name="textBase"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.textBase}
                register={register}
                validations={{
                  required: "Text primary color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Text primary color should be hex format",
                  },
                }}
              />
            </div>

            <div className="flex flex-col items-start justify-center gap-2">
              <h3 className="text-left text-base text-brand-secondary">Text secondary</h3>
              <Input
                id="textSecondary"
                name="textSecondary"
                type="name"
                placeholder="#FFFFFF"
                autoComplete="off"
                error={errors.textSecondary}
                register={register}
                validations={{
                  required: "Text secondary color is required",
                  pattern: {
                    value: /^#(?:[0-9a-fA-F]{3}){1,2}$/g,
                    message: "Text secondary color should be hex format",
                  },
                }}
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
