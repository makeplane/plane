import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import type { IUserTheme } from "@plane/types";
import { InputColorPicker } from "@plane/ui";

type Props = {
  control: Control<IUserTheme>;
};

export const CustomThemeColorInputs = observer(function CustomThemeColorInputs(props: Props) {
  const { control } = props;

  const handleValueChange = (val: string | undefined, onChange: (...args: unknown[]) => void) => {
    let hex = val;
    // prepend a hashtag if it doesn't exist
    if (val && val[0] !== "#") hex = `#${val}`;
    onChange(hex);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Neutral Color */}
      <div className="flex flex-col gap-2">
        <h3 className="text-body-sm-medium">
          Neutral color<span className="text-danger-primary">*</span>
        </h3>
        <div className="w-full">
          <Controller
            control={control}
            name="background"
            rules={{
              required: "Neutral color is required",
              pattern: {
                value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                message: "Enter a valid hex code",
              },
            }}
            render={({ field: { value, onChange } }) => (
              <InputColorPicker
                name="background"
                value={value}
                onChange={(val) => handleValueChange(val, onChange)}
                placeholder="#1a1a1a"
                className="w-full placeholder:text-placeholder"
                style={{
                  backgroundColor: value,
                  color: "#ffffff",
                }}
                hasError={false}
              />
            )}
          />
        </div>
      </div>
      {/* Brand Color */}
      <div className="flex flex-col gap-2">
        <h3 className="text-body-sm-medium">
          Brand color<span className="text-danger-primary">*</span>
        </h3>
        <div className="w-full">
          <Controller
            control={control}
            name="primary"
            rules={{
              required: "Brand color is required",
              pattern: {
                value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                message: "Enter a valid hex code",
              },
            }}
            render={({ field: { value, onChange } }) => (
              <InputColorPicker
                name="primary"
                value={value}
                onChange={(val) => handleValueChange(val, onChange)}
                placeholder="#3f76ff"
                className="w-full placeholder:text-placeholder"
                style={{
                  backgroundColor: value,
                  color: "#ffffff",
                }}
                hasError={false}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
});
