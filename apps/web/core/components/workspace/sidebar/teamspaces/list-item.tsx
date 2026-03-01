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
import { useParams, usePathname } from "next/navigation";
import { Transition } from "@headlessui/react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { IconButton } from "@plane/propel/icon-button";
import { ChevronRightIcon } from "@plane/propel/icons";
// plane ui
import { cn, joinUrlPath } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string;
  handleLinkClick: () => void;
};

export const TeamspaceSidebarListItem = observer(function TeamspaceSidebarListItem(props: Props) {
  const { teamspaceId, handleLinkClick } = props;
  // router params
  const { workspaceSlug } = useParams();
  // pathname
  const pathname = usePathname();
  const { getTeamspaceById, getTeamspaceProjectIds } = useTeamspaces();
  const { getProjectById } = useProject();
  // state for disclosure
  const [isExpanded, setIsExpanded] = useState(false);

  const teamspace = getTeamspaceById(teamspaceId);
  const projectIds = getTeamspaceProjectIds(teamspaceId) || [];

  if (!teamspace) return null;

  const isTeamspaceActive = pathname.includes(joinUrlPath(workspaceSlug?.toString(), "teamspaces", teamspaceId));

  return (
    <div className="flex flex-col">
      <SidebarNavItem isActive={isTeamspaceActive} className="group/teamspace-item">
        <div className="flex items-center w-full">
          <Link
            href={`/${workspaceSlug}/teamspaces/${teamspaceId}`}
            onClick={handleLinkClick}
            className="flex flex-1 items-center gap-1.5 py-[1px] truncate"
          >
            <Logo logo={teamspace.logo_props} size={16} />
            <p className="text-body-xs-medium text-secondary leading-5 font-medium truncate">{teamspace.name}</p>
          </Link>
          {projectIds.length > 0 && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={ChevronRightIcon}
              onClick={() => setIsExpanded(!isExpanded)}
              className="opacity-0 group-hover/teamspace-item:opacity-100 text-tertiary"
              iconClassName={cn("transition-transform", {
                "rotate-90": isExpanded,
              })}
            />
          )}
        </div>
      </SidebarNavItem>

      <Transition
        show={isExpanded}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isExpanded && projectIds.length > 0 && (
          <div className="flex flex-col gap-0.5 ml-4 mt-1">
            {projectIds.map((projectId) => {
              const project = getProjectById(projectId);
              if (!project) return null;

              const isProjectActive = pathname.includes(
                joinUrlPath(workspaceSlug?.toString(), "teamspaces", teamspaceId, "projects", projectId)
              );

              return (
                <Link
                  key={projectId}
                  href={`/${workspaceSlug}/teamspaces/${teamspaceId}/projects/${projectId}`}
                  onClick={handleLinkClick}
                >
                  <SidebarNavItem isActive={isProjectActive}>
                    <div className="flex items-center gap-1.5 py-[1px] truncate">
                      <Logo logo={project.logo_props} size={14} />
                      <p className="text-caption-sm-medium leading-4 font-medium truncate">{project.name}</p>
                    </div>
                  </SidebarNavItem>
                </Link>
              );
            })}
          </div>
        )}
      </Transition>
    </div>
  );
});
