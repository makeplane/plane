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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserProjectRoles } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { CreateUpdateEpicModal } from "@/components/epics/epic-modal";
import { useIssueTypes } from "@/plane-web/hooks/store";

export const ProjectEpicsEmptyState = observer(function ProjectEpicsEmptyState() {
  // router
  const { projectId } = useParams();
  // states
  const [isCreateIssueModalOpen, setIsCreateIssueModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getProjectEpicId } = useIssueTypes();
  // derived values
  const projectEpicId = getProjectEpicId(projectId?.toString());
  const hasProjectMemberLevelPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <CreateUpdateEpicModal
        isOpen={isCreateIssueModalOpen}
        onClose={() => setIsCreateIssueModalOpen(false)}
        data={{
          project_id: projectId.toString(),
          type_id: projectEpicId,
        }}
      />
      <EmptyStateDetailed
        assetKey="epic"
        title={t("project_empty_state.epics.title")}
        description={t("project_empty_state.epics.description")}
        actions={[
          {
            label: t("project_empty_state.epics.cta_primary"),
            onClick: () => setIsCreateIssueModalOpen(true),
            disabled: !hasProjectMemberLevelPermissions,
          },
        ]}
      />
    </div>
  );
});
