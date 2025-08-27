"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
// plane imports
import { cn } from "@plane/utils";
// components
import { DeleteProjectModal } from "@/components/project/delete-project-modal";
import { JoinProjectModal } from "@/components/project/join-project-modal";
import { ArchiveRestoreProjectModal } from "@/components/project/settings/archive-project/archive-restore-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store";
import { TProject } from "@/plane-web/types/projects";
import { EProjectScope } from "@/plane-web/types/workspace-project-filters";
// local imports
import { JoinButton } from "../../common/join-button";
import { Attributes } from "../attributes";
import { Details } from "./details";

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
  const router = useRouter();
  const { updateProject } = useProject();
  const { filters } = useProjectFilter();
  // derived values
  const isMemberOfProject = !!project.member_role;
  const isArchived = pathname.includes("/archives");

  const handleUpdateProject = (data: Partial<TProject>) => {
    updateProject(workspaceSlug.toString(), project.id, data);
  };

  if (!currentWorkspace) return null;
  return (
    <div
      className={cn(
        "flex flex-col justify-between group/project-card rounded border border-custom-border-200 bg-custom-background-100 w-full",
        {
          "bg-custom-background-80": isArchived,
        }
      )}
    >
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
      <Link
        draggable={false}
        href={`/${workspaceSlug}/projects/${project.id}/issues`}
        onClick={(e) => {
          if (!isMemberOfProject || isArchived) {
            e.preventDefault();
            e.stopPropagation();
            if (!isArchived) setJoinProjectModal(true);
          } else {
            router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
          }
        }}
        data-prevent-progress={!isMemberOfProject || isArchived}
        className={cn("group/project-card flex flex-col justify-between w-full", {
          "bg-custom-background-80": isArchived,
        })}
      >
        <>
          <div className="bg-custom-background-100">
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
              dateClassname="block"
              displayProperties={{ state: true, priority: true, lead: true, members: true, date: true }}
            />
          </div>
        </>
      </Link>

      {!project.archived_at && filters?.scope === EProjectScope.ALL_PROJECTS && (
        <JoinButton className="m-4 mt-0" project={project} />
      )}
    </div>
  );
});
