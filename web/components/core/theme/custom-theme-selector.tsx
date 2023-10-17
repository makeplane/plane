import { FC } from "react";
import { useTheme } from "next-themes";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, InputColorPicker } from "@plane/ui";
// types
import { IUserTheme } from "types";
// mobx react lite
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";

type Props = {};

export const CustomThemeSelector: FC<Props> = observer(() => {
  const { user: userStore } = useMobxStore();
  const userTheme = userStore?.currentUser?.theme;
  // hooks
  const { setTheme } = useTheme();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
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

    return userStore.updateCurrentUser({ theme: payload });
  };

  return (
    <form onSubmit={handleSubmit(handleUpdateTheme)}>
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-custom-text-100">Customize your theme</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Background color</h3>
              <Controller
                control={control}
                name="background"
                render={({ field: { value, onChange } }) => (
                  <InputColorPicker
                    name="background"
                    value={value}
                    onChange={onChange}
                    className=""
                    placeholder="#ffffff"
                    hasError={Boolean(errors?.background)}
                  />
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Text color</h3>
              <Controller
                control={control}
                name="text"
                render={({ field: { value, onChange } }) => (
                  <InputColorPicker
                    name="text"
                    value={value}
                    onChange={onChange}
                    className=""
                    placeholder="#ffffff"
                    hasError={Boolean(errors?.text)}
                  />
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Primary(Theme) color</h3>
              <Controller
                control={control}
                name="primary"
                render={({ field: { value, onChange } }) => (
                  <InputColorPicker
                    name="primary"
                    value={value}
                    onChange={onChange}
                    className=""
                    placeholder="#ffffff"
                    hasError={Boolean(errors?.primary)}
                  />
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Sidebar background color</h3>
              <Controller
                control={control}
                name="sidebarBackground"
                render={({ field: { value, onChange } }) => (
                  <InputColorPicker
                    name="sidebarBackground"
                    value={value}
                    onChange={onChange}
                    className=""
                    placeholder="#ffffff"
                    hasError={Boolean(errors?.sidebarBackground)}
                  />
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-2">
              <h3 className="text-left text-sm font-medium text-custom-text-200">Sidebar text color</h3>
              <Controller
                control={control}
                name="sidebarText"
                render={({ field: { value, onChange } }) => (
                  <InputColorPicker
                    name="sidebarText"
                    value={value}
                    onChange={onChange}
                    className=""
                    placeholder="#ffffff"
                    hasError={Boolean(errors?.sidebarText)}
                  />
                )}
              />
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
