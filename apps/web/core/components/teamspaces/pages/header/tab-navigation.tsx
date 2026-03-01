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

import type { FC } from "react";
import Link from "next/link";
// types
import type { TPageNavigationTabs } from "@plane/types";
// helpers
import { cn } from "@plane/utils";

type TTeamspacePageTabNavigation = {
  workspaceSlug: string;
  teamspaceId: string;
  pageType: TPageNavigationTabs;
};

const teamspacePageTabs: { key: TPageNavigationTabs; label: string }[] = [
  {
    key: "public",
    label: "Public",
  },
  {
    key: "archived",
    label: "Archived",
  },
];

export function TeamspacePageTabNavigation(props: TTeamspacePageTabNavigation) {
  const { workspaceSlug, teamspaceId, pageType } = props;

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, tabKey: TPageNavigationTabs) => {
    if (tabKey === pageType) e.preventDefault();
  };

  return (
    <div className="relative flex items-center">
      {teamspacePageTabs.map((tab) => (
        <Link
          key={tab.key}
          href={`/${workspaceSlug}/teamspaces/${teamspaceId}/pages?type=${tab.key}`}
          onClick={(e) => handleTabClick(e, tab.key)}
        >
          <span
            className={cn(`block p-3 py-4 text-body-xs-medium transition-all`, {
              "text-accent-primary": tab.key === pageType,
            })}
          >
            {tab.label}
          </span>
          <div
            className={cn(`rounded-t border-t-2 transition-all border-transparent`, {
              "border-accent-strong": tab.key === pageType,
            })}
          />
        </Link>
      ))}
    </div>
  );
}
