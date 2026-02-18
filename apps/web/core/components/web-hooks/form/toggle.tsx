/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// constants
import { useTranslation } from "@plane/i18n";
import type { IWebhook } from "@plane/types";
// ui
import { ToggleSwitch } from "@plane/ui";

interface IWebHookToggle {
  control: Control<IWebhook, any>;
}

export function WebhookToggle({ control }: IWebHookToggle) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-6">
      <div className="text-13 font-medium">{t("workspace_settings.webhooks.enable_webhook")}</div>
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
