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

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-medium leading-6 text-brand-base">Customize your theme</h3>
        <div className="space-y-4">
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
