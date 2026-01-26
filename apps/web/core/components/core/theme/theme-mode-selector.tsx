import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import type { IUserTheme } from "@plane/types";

type Props = {
  control: Control<IUserTheme>;
};

export const CustomThemeModeSelector = observer(function CustomThemeModeSelector(props: Props) {
  const { control } = props;

  return (
    <div>
      <h6 className="text-h6-medium">
        Choose color mode<span className="text-danger-primary">*</span>
      </h6>
      <Controller
        control={control}
        name="darkPalette"
        render={({ field: { value, onChange } }) => (
          <div className="mt-2 flex items-center gap-3">
            <label className="bg-layer-2 hover:bg-layer-2-hover border border-subtle-1 rounded-lg py-2 px-3 flex items-center gap-1.5 text-body-sm-regular cursor-pointer transition-colors">
              <input
                type="radio"
                name="darkPalette"
                value="false"
                checked={value === false}
                onChange={() => onChange(false)}
                className="cursor-pointer"
              />
              Light mode
            </label>
            <label className="bg-layer-2 hover:bg-layer-2-hover border border-subtle-1 rounded-lg py-2 px-3 flex items-center gap-1.5 text-body-sm-regular cursor-pointer transition-colors">
              <input
                type="radio"
                name="darkPalette"
                value="true"
                checked={value === true}
                onChange={() => onChange(true)}
                className="cursor-pointer"
              />
              Dark mode
            </label>
          </div>
        )}
      />
    </div>
  );
});
