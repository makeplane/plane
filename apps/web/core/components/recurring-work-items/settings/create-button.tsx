/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ButtonProps } from "@plane/propel/button";
import { getCreateUpdateRecurringWorkItemSettingsPath } from "@plane/utils";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useRecurringWorkItems } from "@/plane-web/hooks/store/recurring-work-items/use-recurring-work-items";

type TCreateRecurringWorkItemsButtonProps = {
  workspaceSlug: string;
  projectId: string;
  buttonI18nLabel?: string;
  buttonSize?: NonNullable<ButtonProps["size"]>;
};

export const CreateRecurringWorkItemsButton = observer(function CreateRecurringWorkItemsButton(
  props: TCreateRecurringWorkItemsButtonProps
) {
  const { workspaceSlug, projectId, buttonI18nLabel, buttonSize } = props;
  // router
  const router = useAppRouter();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getCanCreate } = useRecurringWorkItems();
  // derived values
  const createPath = getCreateUpdateRecurringWorkItemSettingsPath({
    workspaceSlug,
    projectId,
  });
  const canCreate = getCanCreate(workspaceSlug, projectId);

  const getButtonLabel = useCallback(() => {
    if (!canCreate) return t("recurring_work_items.settings.create_button.no_permission");

    return t(buttonI18nLabel || "recurring_work_items.settings.create_button.label");
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreate, buttonI18nLabel]);

  if (!canCreate) return null;
  return (
    <Button
      variant="primary"
      size={buttonSize}
      className="flex items-center justify-center gap-1.5"
      disabled={!canCreate}
      onClick={() => {
        router.push(createPath);
      }}
    >
      {getButtonLabel()}
    </Button>
  );
});
