"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
import { useProjectLinks } from "@/plane-web/hooks/store";
import { useProjectAttachments } from "@/plane-web/hooks/store/projects/use-project-attachments";
// local components
import { ProjectAttachmentRoot } from "./collaspible-section/attachment";
import { ProjectAttachmentActionButton } from "./collaspible-section/attachment/quick-action-button";
import { ProjectLinkRoot } from "./collaspible-section/links";
import { useLinks } from "./collaspible-section/links/use-links";
import { ProjectActionButton } from "./collaspible-section/quick-action-button";

type Props = {
  workspaceSlug: string;
  projectId: string;
  disabled?: boolean;
};

export const ProjectOverviewCollapsibleSectionRoot: FC<Props> = observer((props) => {
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
    </>
  );
});
