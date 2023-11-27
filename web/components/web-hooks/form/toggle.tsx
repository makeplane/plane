import { Control, Controller } from "react-hook-form";
// ui
import { ToggleSwitch } from "@plane/ui";
// types
import { IWebhook } from "types/webhook";

interface IWebHookToggle {
  control: Control<IWebhook, any>;
}

export const WebhookToggle = ({ control }: IWebHookToggle) => (
  <div className="flex gap-6">
    <div className="text-sm font-medium">Enable webhook</div>
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
