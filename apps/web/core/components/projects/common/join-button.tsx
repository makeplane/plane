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
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// plane imports
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
// components
import { JoinProjectModal } from "@/components/projects/modals/join-project-modal";
// plane web imports
import type { TProject } from "@/types/projects";

type Props = {
  project: TProject;
  className?: string;
};

export function JoinButton(props: Props) {
  const { project, className } = props;
  // router
  const { workspaceSlug } = useParams();
  const router = useRouter();
  // states
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  // derived values
  const isMemberOfProject = !!project.member_role;

  return (
    <>
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {isMemberOfProject ? (
        <Link
          href={`/${workspaceSlug}/projects/${project.id}/issues`}
          tabIndex={-1}
          className={cn(
            "w-auto cursor-pointer rounded-sm px-3 py-1.5 text-center text-13 font-medium outline-none my-0 flex-end bg-success-subtle text-success-primary hover:bg-success-subtle-1 focus:bg-success-subtle-1",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMemberOfProject) {
              router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
            } else {
              setJoinProjectModal(true);
            }
          }}
        >
          {isMemberOfProject ? "Joined" : "Join"}
        </Link>
      ) : (
        <Button
          tabIndex={-1}
          variant="secondary"
          className={cn(
            "w-auto cursor-pointer rounded-sm px-3 py-1.5 text-center text-13 font-medium outline-none my-0 flex-end",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isMemberOfProject) {
              router.push(`/${workspaceSlug}/projects/${project.id}/issues`);
            } else {
              setJoinProjectModal(true);
            }
          }}
        >
          {isMemberOfProject ? "Joined" : "Join"}
        </Button>
      )}
    </>
  );
}
