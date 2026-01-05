import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// constants
import type { IWebhook } from "@plane/types";
// ui
import { ToggleSwitch } from "@plane/ui";

interface IWebHookToggle {
  control: Control<IWebhook, any>;
}

export function WebhookToggle({ control }: IWebHookToggle) {
  return (
    <div className="flex gap-6">
      <div className="text-13 font-medium">Enable webhook</div>
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
}
