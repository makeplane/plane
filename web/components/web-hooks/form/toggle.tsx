import { Control, Controller } from "react-hook-form";
import { IExtendedWebhook } from "types/webhook";
import { ToggleSwitch } from "@plane/ui";

interface IWebHookToggle {
  control: Control<IExtendedWebhook, any>;
}

export const WebHookToggle = ({ control }: IWebHookToggle) => (
  <div className="flex gap-6">
    <div className="text-sm"> Enable webhook </div>
    <Controller
      control={control}
      name="is_active"
      render={({ field: { onChange, value } }) => (
        <ToggleSwitch
          value={value}
          onChange={(val: boolean) => {
            onChange(val);
          }}
          size="sm"
        />
      )}
    />
  </div>
);
