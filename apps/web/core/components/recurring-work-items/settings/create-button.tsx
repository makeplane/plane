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
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { ButtonProps } from "@plane/propel/button";
import { EUserProjectRoles } from "@plane/types";
import { getCreateUpdateRecurringWorkItemSettingsPath } from "@plane/utils";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";

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
  const { allowPermissions } = useUserPermissions();
  // derived values
  const createPath = getCreateUpdateRecurringWorkItemSettingsPath({
    workspaceSlug,
    projectId,
  });
  const hasAdminPermission = allowPermissions(
    [EUserProjectRoles.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const getButtonLabel = useCallback(() => {
    if (!hasAdminPermission) return t("recurring_work_items.settings.create_button.no_permission");

    return t(buttonI18nLabel || "recurring_work_items.settings.create_button.label");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAdminPermission, buttonI18nLabel]);

  if (!hasAdminPermission) return null;
  return (
    <Button
      variant="primary"
      size={buttonSize}
      className="flex items-center justify-center gap-1.5"
      disabled={!hasAdminPermission}
      onClick={() => {
        router.push(createPath);
      }}
    >
      {getButtonLabel()}
    </Button>
  );
});
