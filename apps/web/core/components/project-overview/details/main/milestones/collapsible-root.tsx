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
// components
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { useProject } from "@/hooks/store/use-project";
import { CollapsibleDetailSection } from "@/components/common/layout/main/sections/collapsible-root";
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { useMilestones } from "@/plane-web/hooks/store/use-milestone";
import { AddMilestoneButton } from "./add-milestone-button";
import { CreateUpdateMilestoneModal } from "./create-update-modal";
import { ProjectMilestoneRoot } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
};
export const ProjectMilestoneCollapsible = observer(function ProjectMilestoneCollapsible(props: Props) {
  const { workspaceSlug, projectId } = props;
  // state
  const [isCreateUpdateMilestoneModalOpen, setIsCreateUpdateMilestoneModalOpen] = useState(false);
  // store hooks
  const { openCollapsibleSection, toggleOpenCollapsibleSection } = useProject();
  const { isMilestonesEnabled } = useMilestones();
  const { getProjectMilestoneIds } = useMilestones();
  // derived values
  const projectMilestoneIds = getProjectMilestoneIds(projectId);
  const milestoneCount = projectMilestoneIds?.length ?? 0;

  const toggleCreateUpdateModal = () => {
    setIsCreateUpdateMilestoneModalOpen((prev) => !prev);
  };

  const shouldRenderMilestones = isMilestonesEnabled(workspaceSlug, projectId);
  if (!shouldRenderMilestones) return null;

  return (
    <>
      <CreateUpdateMilestoneModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isCreateUpdateMilestoneModalOpen}
        handleClose={() => setIsCreateUpdateMilestoneModalOpen(false)}
      />
      <CollapsibleDetailSection
        title="Milestones"
        actionItemElement={<AddMilestoneButton toggleModal={toggleCreateUpdateModal} variant="compact" />}
        count={milestoneCount}
        collapsibleContent={
          <div className="mt-3">
            <ProjectMilestoneRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              toggleCreateUpdateModal={toggleCreateUpdateModal}
            />
          </div>
        }
        isOpen={openCollapsibleSection.includes("milestones")}
        onToggle={() => toggleOpenCollapsibleSection("milestones")}
      />
      <IssuePeekOverview />
      <EpicPeekOverview />
    </>
  );
});
