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
import { useParams } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
// ui
import { CycleIcon, WorkItemsIcon, PageIcon, ProjectIcon, ViewsIcon } from "@plane/propel/icons";

type TTeamQuickLink = {
  key: string;
  name: string;
  icon: React.ReactNode;
  href: string;
};

export const TeamsOverviewQuickLinks = observer(function TeamsOverviewQuickLinks() {
  const { teamspaceId } = useParams();
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  // derived values
  const workspaceSlug = routerWorkspaceSlug?.toString();

  const TEAM_QUICK_LINKS: TTeamQuickLink[] = [
    {
      key: "projects",
      name: "Projects",
      icon: <ProjectIcon className="size-3.5 text-tertiary" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/projects`,
    },
    {
      key: "issues",
      name: "Work items",
      icon: <WorkItemsIcon className="size-3.5 text-tertiary" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/issues`,
    },
    {
      key: "cycles",
      name: "Cycles",
      icon: <CycleIcon className="size-3.5 text-tertiary" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/cycles`,
    },
    {
      key: "views",
      name: "Views",
      icon: <ViewsIcon className="size-3.5 text-tertiary" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/views`,
    },
    {
      key: "pages",
      name: "Pages",
      icon: <PageIcon className="size-3.5 text-tertiary" />,
      href: `/${workspaceSlug}/teamspaces/${teamspaceId}/pages`,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-y-2 pb-6">
      <div className="text-body-xs-semibold text-tertiary">Jump into</div>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-5 items-center gap-3">
        {TEAM_QUICK_LINKS.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="group flex w-full items-center justify-between gap-1.5 px-1.5 py-1 bg-layer-2 hover:bg-layer-2-hover active:bg-layer-2-active text-secondary border border-strong rounded-md shadow-raised-100 transition-colors"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="flex items-center justify-center size-6  rounded flex-shrink-0">{link.icon}</div>
              <span className="text-body-xs-medium text-secondary group-hover:text-primary truncate">{link.name}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex-shrink-0">
              <ChevronRightIcon className="size-3.5 text-tertiary" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});
