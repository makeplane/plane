import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane internal packages
import { ToggleSwitch } from "@plane/ui";

type Props<T extends FieldValues = FieldValues> = {
  control: Control<T>;
  field: TControllerSwitchFormField<T>;
};

export type TControllerSwitchFormField<T extends FieldValues = FieldValues> = {
  name: FieldPath<T>;
  label: string;
};

export function ControllerSwitch<T extends FieldValues>(props: Props<T>) {
  const {
    control,
    field: { name, label },
  } = props;

  return (
    <div className="flex items-center justify-between gap-1">
      <h4 className="text-sm text-custom-text-300">Refresh user attributes from {label} during sign in</h4>
      <div className="relative">
        <Controller
          control={control}
          name={name as FieldPath<T>}
          render={({ field: { value, onChange } }) => (
            <ToggleSwitch
              value={Boolean(parseInt(value))}
              onChange={() => (parseInt(value) ? onChange("0") : onChange("1"))}
              size="sm"
            />
          )}
        />
      </div>
    </div>
  );
}
