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
import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BriefcaseIcon } from "lucide-react";
// components
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store/teamspaces";
// local imports
import { LinkProjectModal } from "./link-modal";

type UpdateTeamspaceProjectsButtonProps = {
  variant?: "default" | "empty-state";
  teamspaceId: string;
  isEditingAllowed: boolean;
  renderButton?: (args: { open: () => void; isEditingAllowed: boolean; areProjectsPresent: boolean }) => ReactNode;
};

const TOOLTIP_CONTENT = "You don't have permission to add project.";

export const UpdateTeamspaceProjectsButton = observer(function UpdateTeamspaceProjectsButton(
  props: UpdateTeamspaceProjectsButtonProps
) {
  const { variant = "default", teamspaceId, isEditingAllowed, renderButton } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isModalOpen, setIsModalOpen] = useState(false);
  // hooks
  const { workspaceProjectIds } = useProject();
  // plane web hooks
  const { getTeamspaceById, updateTeamspace } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);
  const areProjectsPresent = teamspace?.project_ids && teamspace.project_ids.length > 0;

  const handleProjectsUpdate = async (teamspaceProjectIds: string[]) => {
    if (!teamspaceId) return;
    await updateTeamspace(workspaceSlug?.toString(), teamspaceId, { project_ids: teamspaceProjectIds })
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Teamspace projects updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update teamspace projects. Please try again!`,
        });
      });
  };

  if (!teamspace) return null;

  const open = () => {
    if (!isEditingAllowed) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <LinkProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teamspaceId={teamspaceId}
        onSubmit={handleProjectsUpdate}
        selectedProjectIds={teamspace.project_ids ?? []}
        projectIds={workspaceProjectIds ?? []}
      />

      {renderButton ? (
        <>{renderButton({ open, isEditingAllowed, areProjectsPresent: Boolean(areProjectsPresent) })}</>
      ) : (
        <>
          {variant === "default" && (
            <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="left">
              <Button
                variant="secondary"
                size="base"
                prependIcon={<BriefcaseIcon />}
                onClick={open}
                disabled={!isEditingAllowed}
                className={cn(
                  "group/projects transition-[width] ease-linear duration-700",
                  !isEditingAllowed && "cursor-not-allowed"
                )}
              >
                {!areProjectsPresent && "Link a project"}
                {areProjectsPresent && (
                  <>
                    <span className={cn(isEditingAllowed && "group-hover/projects:hidden")}>
                      {teamspace.project_ids?.length}
                    </span>
                    <span className={cn("hidden", isEditingAllowed && "group-hover/projects:inline")}>
                      Update projects
                    </span>
                  </>
                )}
              </Button>
            </Tooltip>
          )}
          {variant === "empty-state" && (
            <Tooltip tooltipContent={TOOLTIP_CONTENT} disabled={isEditingAllowed} position="right">
              <div>
                <Button
                  variant="primary"
                  className="flex-shrink-0 mt-2 text-caption-sm-medium"
                  onClick={open}
                  disabled={!isEditingAllowed}
                >
                  Link a project
                </Button>
              </div>
            </Tooltip>
          )}
        </>
      )}
    </>
  );
});
