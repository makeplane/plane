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
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useParams } from "react-router";

export const InitiativeScopeProjectsEmptyState = observer(function InitiativeScopeProjectsEmptyState() {
  // routers
  const { initiativeId, workspaceSlug } = useParams();
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const {
    initiative: { permissions, toggleProjectsModal },
  } = useInitiatives();
  // derived values
  const canAddProject = workspaceSlug && initiativeId && permissions.getCanAddProject(workspaceSlug, initiativeId);

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
            disabled: !canAddProject,
          },
        ]}
      />
    </div>
  );
});
