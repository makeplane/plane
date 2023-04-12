import { useEffect, useState } from "react";

// react-hook-form
import { useForm } from "react-hook-form";
// ui
import { Input, PrimaryButton, SecondaryButton } from "components/ui";

const defaultValues = {
  palette: "",
};

export const ThemeForm: React.FC<any> = ({ handleFormSubmit, handleClose, status, data }) => {
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<any>({
    defaultValues,
  });
  const [darkPalette, setDarkPalette] = useState(false);

  const handleUpdateTheme = async (formData: any) => {
    await handleFormSubmit({ ...formData, darkPalette });

    reset({
      ...defaultValues,
    });
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, reset]);

  // --color-bg-base: 25, 27, 27;
  //   --color-bg-surface-1: 31, 32, 35;
  //   --color-bg-surface-2: 39, 42, 45;

  //   --color-border: 46, 50, 52;
  //   --color-bg-sidebar: 19, 20, 22;
  //   --color-accent: 60, 133, 217;

  //   --color-text-base: 255, 255, 255;
  //   --color-text-secondary: 142, 148, 146;

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-brand-base">Customize your theme</h3>
        <div className="space-y-4">
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <Input
                id="bgBase"
                label="Background"
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
            <div className="sm:col-span-2">
              <Input
                id="bgSurface1"
                label="Background surface 1"
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
            <div className="sm:col-span-2">
              <Input
                id="bgSurface2"
                label="Background surface 2"
                name="bgSurface1"
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

            <div className="sm:col-span-2">
              <Input
                id="border"
                label="Border"
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
            <div className="sm:col-span-2">
              <Input
                id="sidebar"
                label="Sidebar"
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
            <div className="sm:col-span-2">
              <Input
                id="accent"
                label="Accent"
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
            <div className="sm:col-span-3">
              <Input
                id="textBase"
                label="Text primary"
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
            <div className="sm:col-span-3">
              <Input
                id="textSecondary"
                label="Text secondary"
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

          <div>
            <Input
              id="palette"
              label="All colors"
              name="palette"
              type="name"
              placeholder="Enter comma separated hex colors"
              autoComplete="off"
              error={errors.palette}
              register={register}
              validations={{
                required: "Color values is required",
                pattern: {
                  value: /^(#(?:[0-9a-fA-F]{3}){1,2},){7}#(?:[0-9a-fA-F]{3}){1,2}$/g,
                  message: "Color values should be hex format, separated by commas",
                },
              }}
            />
          </div>
          <div
            className="flex cursor-pointer items-center gap-1"
            onClick={() => setDarkPalette((prevData) => !prevData)}
          >
            <span className="text-xs">Dark palette</span>
            <button
              type="button"
              className={`pointer-events-none relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
                darkPalette ? "bg-brand-accent" : "bg-gray-300"
              } transition-colors duration-300 ease-in-out focus:outline-none`}
              role="switch"
              aria-checked="false"
            >
              <span className="sr-only">Dark palette</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-3 w-3 ${
                  darkPalette ? "translate-x-3" : "translate-x-0"
                } transform rounded-full bg-brand-surface-2 shadow ring-0 transition duration-300 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" loading={isSubmitting}>
          {status
            ? isSubmitting
              ? "Updating Theme..."
              : "Update Theme"
            : isSubmitting
            ? "Creating Theme..."
            : "Set Theme"}
        </PrimaryButton>
      </div>
    </form>
  );
};
