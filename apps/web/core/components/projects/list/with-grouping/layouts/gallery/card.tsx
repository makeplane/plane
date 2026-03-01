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
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
// plane imports
import { cn } from "@plane/utils";
// components
import { DeleteProjectModal } from "@/components/projects/modals/delete-project-modal";
import { JoinProjectModal } from "@/components/projects/modals/join-project-modal";
import { ArchiveRestoreProjectModal } from "@/components/projects/modals/archive-restore-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store";
import type { TProject } from "@/types/projects";
import { EProjectScope } from "@/types/workspace-project-filters";
// local imports
import { Attributes } from "../attributes";
import { Details } from "./details";
import { JoinButton } from "@/components/projects/common/join-button";

type Props = {
  project: TProject;
};

export const ProjectCard = observer(function ProjectCard(props: Props) {
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
        "flex flex-col justify-between group/project-card border border-subtle bg-layer-2 hover:shadow-raised-200 hover:border-strong w-full rounded-lg overflow-hidden duration-300 transition-all",
        {
          "bg-layer-1": isArchived,
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
          "bg-layer-1": isArchived,
        })}
      >
        <>
          <div>
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
