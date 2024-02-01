import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { useTheme } from "next-themes";
// hooks
import { useUser } from "hooks/store";
// ui
import { Button, InputColorPicker } from "@plane/ui";
// types
import { IUserTheme } from "@plane/types";

const inputRules = {
  required: "Background color is required",
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

export const CustomThemeSelector: React.FC = observer(() => {
  const { currentUser, updateCurrentUser } = useUser();
  const userTheme = currentUser?.theme;
  // hooks
  const { setTheme } = useTheme();

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    watch,
  } = useForm<IUserTheme>({
    defaultValues: {
      background: userTheme?.background !== "" ? userTheme?.background : "#0d101b",
      text: userTheme?.text !== "" ? userTheme?.text : "#c5c5c5",
      primary: userTheme?.primary !== "" ? userTheme?.primary : "#3f76ff",
      sidebarBackground: userTheme?.sidebarBackground !== "" ? userTheme?.sidebarBackground : "#0d101b",
      sidebarText: userTheme?.sidebarText !== "" ? userTheme?.sidebarText : "#c5c5c5",
      darkPalette: userTheme?.darkPalette || false,
      palette: userTheme?.palette !== "" ? userTheme?.palette : "",
    },
  });

  const handleUpdateTheme = async (formData: any) => {
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

    setTheme("custom");

    return updateCurrentUser({ theme: payload });
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
                  rules={inputRules}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="background"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#0d101b"
                      className="w-full"
                      style={{
                        backgroundColor: value,
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
                  rules={inputRules}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="text"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#c5c5c5"
                      className="w-full"
                      style={{
                        backgroundColor: watch("background"),
                        color: value,
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
                  rules={inputRules}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="primary"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#3f76ff"
                      className="w-full"
                      style={{
                        backgroundColor: value,
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
                  rules={inputRules}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="sidebarBackground"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#0d101b"
                      className="w-full"
                      style={{
                        backgroundColor: value,
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
                  rules={inputRules}
                  render={({ field: { value, onChange } }) => (
                    <InputColorPicker
                      name="sidebarText"
                      value={value}
                      onChange={(val) => handleValueChange(val, onChange)}
                      placeholder="#c5c5c5"
                      className="w-full"
                      style={{
                        backgroundColor: watch("sidebarBackground"),
                        color: value,
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
