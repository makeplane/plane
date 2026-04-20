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

import { useParams } from "next/navigation";
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
// plane web imports
import { CreateUpdateEpicModal } from "@/components/epics/epic-modal";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TProps = {
  permissions: {
    canCreateWorkItem: (projectId: string) => boolean;
  };
};

export const ProjectEpicsEmptyState = observer(function ProjectEpicsEmptyState(props: TProps) {
  const { permissions } = props;
  // router
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // states
  const [isCreateEpicModalOpen, setIsCreateEpicModalOpen] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getProjectEpicId } = useIssueTypes();
  // derived values
  const projectEpicId = projectId ? getProjectEpicId(projectId) : undefined;

  if (!projectId) return null;
  return (
    <div className="relative h-full w-full overflow-y-auto">
      <CreateUpdateEpicModal
        isOpen={isCreateEpicModalOpen}
        onClose={() => setIsCreateEpicModalOpen(false)}
        data={{
          project_id: projectId,
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
            onClick: () => setIsCreateEpicModalOpen(true),
            disabled: projectId ? !permissions.canCreateWorkItem(projectId) : true,
          },
        ]}
      />
    </div>
  );
});
