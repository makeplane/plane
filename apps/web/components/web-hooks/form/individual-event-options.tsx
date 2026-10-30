/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { CheckboxField } from "@makeplane/propel/components/checkbox-field";
import type { IWebhook } from "@plane/types";

type Props = {
  control: Control<IWebhook, any>;
};

export function WebhookIndividualEventOptions({ control }: Props) {
  const { t } = useTranslation();

  const INDIVIDUAL_WEBHOOK_OPTIONS: {
    key: keyof IWebhook;
    label: string;
    description: string;
  }[] = [
    {
      key: "project",
      label: t("projects"),
      description: t("web_ui.project_created_updated_or_deleted"),
    },
    {
      key: "cycle",
      label: t("cycles"),
      description: t("web_ui.cycle_created_updated_or_deleted"),
    },
    {
      key: "issue",
      label: t("issues"),
      description: t("web_ui.work_item_created_updated_deleted_added_to_a_cycle_or_module"),
    },
    {
      key: "module",
      label: t("modules"),
      description: t("web_ui.module_created_updated_or_deleted"),
    },
    {
      key: "issue_comment",
      label: t("web_ui.work_item_comments"),
      description: t("web_ui.comment_posted_updated_or_deleted"),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 px-6 lg:grid-cols-2">
      {INDIVIDUAL_WEBHOOK_OPTIONS.map((option) => (
        <Controller
          key={option.key}
          control={control}
          name={option.key}
          render={({ field: { onChange, value } }) => (
            <CheckboxField
              name={option.key}
              label={option.label}
              size="lg"
              description={option.description}
              stretch="full"
              checked={value === true}
              onCheckedChange={onChange}
            />
          )}
        />
      ))}
    </div>
  );
}
