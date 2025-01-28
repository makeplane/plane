"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativeAttachmentRoot } from "./collapsible-section/attachment";
import { InitiativeEpicsCollapsibleContent } from "./collapsible-section/epics/content";
import { InitiativeLinksCollapsibleContent } from "./collapsible-section/links/link-components/content";
import { InitiativeProjectsCollapsibleContent } from "./collapsible-section/projects/content";
import { InitiativeAttachmentActionButton } from "./info-section/attachment-button";
import { InitiativeLinksActionButton } from "./info-section/link-button";

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
      getInitiativeEpicsById,
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

  const shouldRenderLinks = !!initiativesLinks && initiativesLinks?.length > 0;
  const shouldRenderProjects = !!projectsIds && projectsIds?.length > 0;
  const shouldRenderAttachments =
    (!!initiativesAttachments && initiativesAttachments?.length > 0) ||
    (!!attachmentUploads && attachmentUploads.length > 0);

  const shouldRenderEpics = true;

  const initiativeEpics = getInitiativeEpicsById(initiativeId) ?? [];

  const linksCount = initiativesLinks?.length ?? 0;
  const attachmentCount = initiativesAttachments?.length ?? 0;

  const epicCount = initiativeEpics?.length ?? 0;

  return (
    <>
      {shouldRenderProjects && (
        <CollapsibleDetailSection
          title="Projects"
          actionItemElement={
            !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleProjectModal(true);
                }}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </button>
            )
          }
          count={attachmentCount}
          collapsibleContent={
            <InitiativeProjectsCollapsibleContent
              workspaceSlug={workspaceSlug}
              projectIds={projectsIds}
              initiativeId={initiativeId}
              disabled={disabled}
            />
          }
          isOpen={openCollapsibleSection.includes("projects")}
          onToggle={() => toggleOpenCollapsibleSection("projects")}
        />
      )}
      {shouldRenderEpics && (
        <CollapsibleDetailSection
          title="Epics"
          actionItemElement={
            !disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggleEpicModal();
                }}
                disabled={disabled}
              >
                <Plus className="h-4 w-4" />
              </button>
            )
          }
          count={epicCount}
          collapsibleContent={
            <>
              <InitiativeEpicsCollapsibleContent
                workspaceSlug={workspaceSlug}
                initiativeId={initiativeId}
                toggleEpicModal={toggleEpicModal}
                disabled={disabled}
              />
            </>
          }
          isOpen={openCollapsibleSection.includes("epics")}
          onToggle={() => toggleOpenCollapsibleSection("epics")}
        />
      )}
      {shouldRenderLinks && (
        <CollapsibleDetailSection
          title="Links"
          actionItemElement={!disabled && <InitiativeLinksActionButton disabled={disabled} />}
          count={linksCount}
          collapsibleContent={
            <InitiativeLinksCollapsibleContent
              workspaceSlug={workspaceSlug}
              initiativeId={initiativeId}
              disabled={disabled}
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
                <InitiativeAttachmentActionButton
                  workspaceSlug={workspaceSlug}
                  initiativeId={initiativeId}
                  disabled={disabled}
                />
              </div>
            )
          }
          count={attachmentCount}
          collapsibleContent={
            <InitiativeAttachmentRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
          }
          isOpen={openCollapsibleSection.includes("attachments")}
          onToggle={() => toggleOpenCollapsibleSection("attachments")}
        />
      )}
    </>
  );
});
