/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { SlidersHorizontal } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";

type Props = {
  onCreate: () => void;
};

export function CustomFieldsEmptyState({ onCreate }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-subtle bg-surface-1 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface-2 text-tertiary">
        <SlidersHorizontal className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="text-body-md-medium text-primary">{t("workspace_settings.settings.custom_fields.empty.title")}</p>
        <p className="max-w-md text-body-sm-regular text-tertiary">
          {t("workspace_settings.settings.custom_fields.empty.description")}
        </p>
      </div>
      <Button variant="primary" onClick={onCreate}>
        {t("workspace_settings.settings.custom_fields.add_field")}
      </Button>
    </div>
  );
}
