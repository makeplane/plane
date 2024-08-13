"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@plane/editor";
import { Button, ControlLink } from "@plane/ui";
import { ArchiveRestoreProjectModal, DeleteProjectModal, JoinProjectModal } from "@/components/project";
// hooks
import { useProject, useWorkspace } from "@/hooks/store";
// types
import { TProject } from "@/plane-web/types/projects";
import Attributes from "./attributes";
import Details from "./details";

type Props = {
  project: TProject;
};

export const ProjectCard: React.FC<Props> = observer((props) => {
  const { project } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [archiveRestoreProject, setArchiveRestoreProject] = useState(false);
  const { workspaceSlug } = useParams();
  const { currentWorkspace } = useWorkspace();
  const pathname = usePathname();
  const { updateProject } = useProject();

  const isArchived = pathname.includes("/archives");
  const handleUpdateProject = (data: Partial<TProject>) => {
    updateProject(workspaceSlug.toString(), project.id, data);
  };

  if (!currentWorkspace) return null;
  return (
    <>
      {/* Delete Project Modal */}
      <DeleteProjectModal
        project={project}
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModal(false)}
      />
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {/* Restore project modal */}
      {workspaceSlug && project && (
        <ArchiveRestoreProjectModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={project.id}
          isOpen={archiveRestoreProject}
          onClose={() => setArchiveRestoreProject(false)}
          archive={!isArchived}
        />
      )}

      <div
        className={cn(
          "group/project-card flex flex-col rounded border border-custom-border-200 bg-custom-background-100 p-2 justify-between",
          {
            "bg-custom-background-80": isArchived,
          }
        )}
      >
        <ControlLink
          href={`/${workspaceSlug}/projects/${project.id}/issues`}
          onClick={(e) => {
            if (!project.is_member || isArchived) {
              e.preventDefault();
              e.stopPropagation();
              if (!isArchived) setJoinProjectModal(true);
            }
          }}
          data-prevent-nprogress={!project.is_member || isArchived}
        >
          <Details
            project={project}
            workspaceSlug={workspaceSlug.toString()}
            setJoinProjectModal={setJoinProjectModal}
            setArchiveRestoreProject={setArchiveRestoreProject}
            setDeleteProjectModal={setDeleteProjectModal}
          />
          <Attributes
            project={project}
            isArchived={isArchived}
            handleUpdateProject={handleUpdateProject}
            workspaceSlug={workspaceSlug.toString()}
            currentWorkspace={currentWorkspace}
          />
        </ControlLink>
        {!project.is_member && (
          <Button
            tabIndex={-1}
            variant="accent-primary"
            className="w-full cursor-pointer rounded px-3 py-1.5 text-center text-sm font-medium outline-none mt-2 flex-end"
            onClick={() => setJoinProjectModal(true)}
          >
            Join
          </Button>
        )}
      </div>
    </>
  );
});
