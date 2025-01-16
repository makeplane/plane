"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { ProjectMultiSelectModal } from "@/components/project";
// hooks
import { useProject } from "@/hooks/store";
// plane web
import { CollapsibleDetailSection } from "@/plane-web/components/common/layout/main/sections/collapsible-root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { InitiativeAttachmentRoot } from "./collapsible-section/attachment";
import { InitiativeEpicsCollapsibleContent } from "./collapsible-section/epics/content";
import { WorkspaceEpicsListModal } from "./collapsible-section/epics/workspace-epic-modal";
import { InitiativeLinksCollapsibleContent } from "./collapsible-section/links/link-components/content";
import { InitiativeProjectsCollapsibleContent } from "./collapsible-section/projects/content";
import { InitiativeAttachmentActionButton } from "./info-section/attachment-button";
import { InitiativeLinksActionButton } from "./info-section/link-button";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeCollapsibleSection: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled } = props;
  // states
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);

  // store hooks
  const {
    initiative: {
      getInitiativeEpicsById,
      getInitiativeById,
      updateInitiative,
      initiativeLinks: { getInitiativeLinks },
      initiativeAttachments: { getAttachmentsByInitiativeId },
      openCollapsibleSection,
      toggleOpenCollapsibleSection,
      addEpicsToInitiative,
    },
  } = useInitiatives();
  const { workspaceProjectIds } = useProject();

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

  // handlers
  const handleProjectsUpdate = async (initiativeProjectIds: string[]) => {
    if (!initiativeId) return;

    if (initiativeProjectIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Please select at least one project.",
      });
      return;
    }

    await updateInitiative(workspaceSlug?.toString(), initiativeId, { project_ids: initiativeProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Initiative projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update initiative projects. Please try again!`,
        });
      });
  };

  const handleAddEpicToInitiative = async (epicIds: string[]) => {
    try {
      addEpicsToInitiative(workspaceSlug?.toString(), initiativeId, epicIds).then(() => {
        setToast({
          title: "Success!",
          type: TOAST_TYPE.SUCCESS,
          message: `Epic${epicIds.length > 1 ? "s" : ""} added to Initiative successfully.`,
        });
      });
    } catch {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Epic addition to Initiative failed. Please try again later.",
      });
    }
  };

  const toggleEpicModal = (value: boolean) => setIsEpicModalOpen(value);

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
                  setIsProjectsOpen(!isProjectsOpen);
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
                  setIsEpicModalOpen(!isEpicModalOpen);
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

      <ProjectMultiSelectModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={projectsIds ?? []}
        projectIds={workspaceProjectIds || []}
      />
      <WorkspaceEpicsListModal
        workspaceSlug={workspaceSlug}
        isOpen={isEpicModalOpen}
        searchParams={{
          initiative_id: initiativeId,
        }}
        handleClose={() => setIsEpicModalOpen(false)}
        handleOnSubmit={async (data) => {
          handleAddEpicToInitiative(data.map((epic) => epic.id));
        }}
      />
    </>
  );
});
