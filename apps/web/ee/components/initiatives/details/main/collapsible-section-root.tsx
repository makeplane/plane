"use client";

import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// components
import { AttachmentsSection } from "./collapsible-section/attachment/attachments-section";
import { EpicsSection } from "./collapsible-section/epics/epics-section";
import { LinksSection } from "./collapsible-section/links/links-section";
import { ProjectsSection } from "./collapsible-section/projects/projects-section";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  toggleEpicModal: (value?: boolean) => void;
  toggleProjectModal: (value?: boolean) => void;
};

export const InitiativeCollapsibleSection: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled, toggleEpicModal, toggleProjectModal } = props;

  // store hooks
  const {
    initiative: {
      epics: { getInitiativeEpicsById },
      getInitiativeById,
      initiativeLinks: { getInitiativeLinks },
      initiativeAttachments: { getAttachmentsByInitiativeId },
      openCollapsibleSection,
      toggleOpenCollapsibleSection,
    },
  } = useInitiatives();

  // derived values
  const initiative = getInitiativeById(initiativeId);
  const initiativesLinks = getInitiativeLinks(initiativeId);
  const attachmentUploads = getAttachmentsByInitiativeId(initiativeId);
  const initiativesAttachments = getAttachmentsByInitiativeId(initiativeId);
  const projectsIds = initiative?.project_ids;
  const initiativeEpics = getInitiativeEpicsById(initiativeId) ?? [];

  const shouldRenderLinks = !!initiativesLinks && initiativesLinks?.length > 0;
  const shouldRenderAttachments =
    (!!initiativesAttachments && initiativesAttachments?.length > 0) ||
    (!!attachmentUploads && attachmentUploads.length > 0);

  const linksCount = initiativesLinks?.length ?? 0;
  const attachmentCount = initiativesAttachments?.length ?? 0;
  const epicCount = initiativeEpics?.length ?? 0;
  const projectCount = projectsIds?.length ?? 0;

  const sectionOrder = useMemo(() => {
    const defaultOrder = ["epics", "projects", "links", "attachments"];
    if (epicCount === 0 && projectCount > 0) {
      return ["projects", "epics", "links", "attachments"];
    }
    return defaultOrder;
  }, [epicCount, projectCount]);

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case "projects":
        return (
          <ProjectsSection
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            projectIds={projectsIds}
            disabled={disabled}
            toggleProjectModal={toggleProjectModal}
            isOpen={openCollapsibleSection.includes("projects")}
            onToggle={() => toggleOpenCollapsibleSection("projects")}
            count={projectCount}
          />
        );
      case "epics":
        return (
          <EpicsSection
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            toggleEpicModal={toggleEpicModal}
            isOpen={openCollapsibleSection.includes("epics")}
            onToggle={() => toggleOpenCollapsibleSection("epics")}
            count={epicCount}
          />
        );
      case "links":
        return (
          shouldRenderLinks && (
            <LinksSection
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              disabled={disabled}
              isOpen={openCollapsibleSection.includes("links")}
              onToggle={() => toggleOpenCollapsibleSection("links")}
              count={linksCount}
            />
          )
        );
      case "attachments":
        return (
          shouldRenderAttachments && (
            <AttachmentsSection
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              disabled={disabled}
              isOpen={openCollapsibleSection.includes("attachments")}
              onToggle={() => toggleOpenCollapsibleSection("attachments")}
              count={attachmentCount}
            />
          )
        );
      default:
        return null;
    }
  };

  return (
    <>
      {sectionOrder.map((sectionType) => (
        <React.Fragment key={sectionType}>{renderSection(sectionType)}</React.Fragment>
      ))}
    </>
  );
});
