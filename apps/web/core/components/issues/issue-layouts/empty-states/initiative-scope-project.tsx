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

import { observer } from "mobx-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserWorkspaceRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

export const InitiativeScopeProjectsEmptyState = observer(function InitiativeScopeProjectsEmptyState() {
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const {
    initiative: { toggleProjectsModal },
  } = useInitiatives();
  // derived values
  const isEditable = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyStateDetailed
        assetKey="project"
        title={t("initiatives.scope.empty_state.title")}
        description={t("initiatives.scope.empty_state.description_projects")}
        actions={[
          {
            label: t("add_project"),
            onClick: () => toggleProjectsModal(true),
            disabled: !isEditable,
          },
        ]}
      />
    </div>
  );
});
