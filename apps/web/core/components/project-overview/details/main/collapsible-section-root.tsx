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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { CollapsibleDetailSection } from "@/components/common/layout/main/sections/collapsible-root";
import { useProjectLinks } from "@/plane-web/hooks/store";
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
// local components
import { ProjectAttachmentRoot } from "./collaspible-section/attachment";
import { ProjectAttachmentActionButton } from "./collaspible-section/attachment/quick-action-button";
import { ProjectLinkRoot } from "./collaspible-section/links";
import { useLinks } from "./collaspible-section/links/use-links";
import { ProjectActionButton } from "./collaspible-section/quick-action-button";
import { ProjectMilestoneCollapsible } from "./milestones/collapsible-root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
};

export const ProjectOverviewCollapsibleSectionRoot = observer(function ProjectOverviewCollapsibleSectionRoot(
  props: Props
) {
  const { workspaceSlug, projectId, disabled = false } = props;
  // store hooks
  const { openCollapsibleSection, toggleOpenCollapsibleSection } = useProject();
  const { getLinksByProjectId } = useProjectLinks();
  const { getAttachmentsByProjectId } = useProjectAttachments();

  // helper hooks
  const { isLinkModalOpen, toggleLinkModal } = useLinks(workspaceSlug.toString(), projectId.toString());

  // derived values
  const projectLinks = getLinksByProjectId(projectId.toString());
  const projectAttachments = getAttachmentsByProjectId(projectId.toString());

  const linksCount = projectLinks?.length ?? 0;
  const attachmentCount = projectAttachments?.length ?? 0;

  const shouldRenderLinks = linksCount > 0;
  const shouldRenderAttachments = attachmentCount > 0;

  return (
    <>
      {shouldRenderLinks && (
        <CollapsibleDetailSection
          title="Links"
          actionItemElement={!disabled && <ProjectActionButton setIsModalOpen={toggleLinkModal} />}
          count={linksCount}
          collapsibleContent={
            <ProjectLinkRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              isModalOpen={isLinkModalOpen}
              setIsModalOpen={toggleLinkModal}
            />
          }
          isOpen={openCollapsibleSection.includes("links")}
          onToggle={() => toggleOpenCollapsibleSection("links")}
        />
      )}

      {shouldRenderAttachments && (
        <CollapsibleDetailSection
          title="Attachments"
          actionItemElement={
            !disabled && (
              <div className="pb-3">
                <ProjectAttachmentActionButton
                  workspaceSlug={workspaceSlug.toString()}
                  projectId={projectId.toString()}
                />
              </div>
            )
          }
          count={attachmentCount}
          collapsibleContent={
            <ProjectAttachmentRoot workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
          }
          isOpen={openCollapsibleSection.includes("attachments")}
          onToggle={() => toggleOpenCollapsibleSection("attachments")}
        />
      )}

      <ProjectMilestoneCollapsible workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
    </>
  );
});
