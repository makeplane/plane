"use client";

import { Control, Controller } from "react-hook-form";
// constants
import { WORKSPACE_SETTINGS_TRACKER_ELEMENTS } from "@plane/constants";
import { IWebhook } from "@plane/types";
// ui
import { ToggleSwitch } from "@plane/ui";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";

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
            captureClick({
              elementName: WORKSPACE_SETTINGS_TRACKER_ELEMENTS.WEBHOOK_DETAILS_PAGE_TOGGLE_SWITCH,
            });
            onChange(val);
          }}
          size="sm"
        />
      )}
    />
  </div>
);
