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

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
// plane imports
import type { TContextMenuItem } from "@plane/ui";
import { ControlLink } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { ArchiveRestoreProjectModal } from "@/components/projects/modals/archive-restore-modal";
import { DeleteProjectModal } from "@/components/projects/modals/delete-project-modal";
import { JoinProjectModal } from "@/components/projects/modals/join-project-modal";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { useProjectFilter } from "@/plane-web/hooks/store";
import type { TProject } from "@/types/projects";
import { EProjectScope } from "@/types/workspace-project-filters";
// store
import type { ProjectItemPermissions } from "@/store/project/permissions/root";
// local imports
import { JoinButton } from "@/components/projects/common/join-button";
import { Attributes } from "../attributes";
import { Details } from "./details";

type Props = {
  project: TProject;
  /** Permissions for the project */
  permissions: ProjectItemPermissions;
  /** Pass when rendering outside project list */
  workspaceSlug: string;
  /** When true, navigation is disabled (e.g. card is non-editable); use ControlLink when true */
  disabled?: boolean;
  /** When true, do not render delete/archive modals */
  hideArchiveDeleteModals?: boolean;
  /** Passed to Details: "scope" hides archive/delete/settings in the menu */
  detailsMenuVariant?: "full" | "scope";
  /** When false, do not render the bottom join button */
  showJoinButton?: boolean;
  /** When true, hide labels in attributes */
  hideLabels?: boolean;
  /** Extra menu items appended to the Details overflow menu */
  additionalMenuItems?: TContextMenuItem[];
};

export const ProjectCard = observer(function ProjectCard(props: Props) {
  const {
    project,
    permissions,
    workspaceSlug,
    disabled = false,
    hideArchiveDeleteModals = false,
    detailsMenuVariant = "full",
    showJoinButton = true,
    hideLabels = false,
    additionalMenuItems,
  } = props;
  // states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [archiveRestoreProject, setArchiveRestoreProject] = useState(false);
  const { currentWorkspace } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const { updateProject, permissions: projectPermissions } = useProject();
  const { filters } = useProjectFilter();
  // derived values
  const canViewProject = projectPermissions.getCanView(workspaceSlug, project.id);
  const isArchived = pathname.includes("/archives");

  const handleUpdateProject = (data: Partial<TProject>) => {
    updateProject(workspaceSlug, project.id, data);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canViewProject || isArchived) {
      e.preventDefault();
      e.stopPropagation();
      if (!isArchived) setJoinProjectModal(true);
      return;
    }
    e.preventDefault();
    router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
  };

  if (!currentWorkspace) return null;

  const linkProps = {
    draggable: false,
    href: `/${workspaceSlug}/projects/${project.id}/issues`,
    onClick: handleClick,
    "data-prevent-progress": !canViewProject || isArchived,
    className: cn("group/project-card flex flex-col justify-between w-full", {
      "bg-layer-1": isArchived,
      "hover:cursor-pointer": !disabled && canViewProject && !isArchived,
    }),
  };

  const content = (
    <div>
      <Details
        project={project}
        workspaceSlug={workspaceSlug}
        permissions={permissions}
        setJoinProjectModal={setJoinProjectModal}
        setArchiveRestoreProject={setArchiveRestoreProject}
        setDeleteProjectModal={setDeleteProjectModal}
        menuVariant={detailsMenuVariant}
        additionalMenuItems={additionalMenuItems}
      />
      <Attributes
        project={project}
        isArchived={isArchived}
        handleUpdateProject={handleUpdateProject}
        workspaceSlug={workspaceSlug}
        canEditProperty={permissions.canEditProperty}
        currentWorkspace={currentWorkspace}
        dateClassname="block"
        displayProperties={{
          state: true,
          priority: true,
          lead: true,
          members: true,
          labels: !hideLabels,
          date: true,
        }}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col justify-between group/project-card border border-subtle bg-layer-2 hover:shadow-raised-200 hover:border-strong w-full rounded-lg overflow-hidden duration-300 transition-all",
        {
          "bg-layer-1": isArchived,
        }
      )}
    >
      {!hideArchiveDeleteModals && (
        <>
          <DeleteProjectModal
            project={project}
            isOpen={deleteProjectModalOpen}
            onClose={() => setDeleteProjectModal(false)}
          />
          {workspaceSlug && project && (
            <ArchiveRestoreProjectModal
              workspaceSlug={workspaceSlug}
              projectId={project.id}
              isOpen={archiveRestoreProject}
              onClose={() => setArchiveRestoreProject(false)}
              archive={!isArchived}
            />
          )}
        </>
      )}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {disabled ? (
        <ControlLink {...linkProps} disabled={disabled || !canViewProject}>
          {content}
        </ControlLink>
      ) : (
        <Link {...linkProps}>{content}</Link>
      )}

      {showJoinButton && !project.archived_at && filters?.scope === EProjectScope.ALL_PROJECTS && (
        <JoinButton className="m-4 mt-0" project={project} />
      )}
    </div>
  );
});
