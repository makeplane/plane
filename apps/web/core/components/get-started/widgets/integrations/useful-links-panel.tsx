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
import { memo } from "react";
import { Button } from "@plane/propel/button";
import { cn } from "@plane/utils";
import type { TUsefulLink } from "./utils";

type UsefulLinksPanelProps = {
  readonly links: TUsefulLink[];
  readonly isWorkspaceAdmin: boolean;
};

export const UsefulLinksPanel: FC<UsefulLinksPanelProps> = memo(function UsefulLinksPanel({ links, isWorkspaceAdmin }) {
  return (
    <nav
      className={cn(
        "flex flex-col items-start gap-4 rounded-xl bg-layer-2 border border-subtle p-2 w-full max-w-52 shadow-raised-100",
        !isWorkspaceAdmin && "max-w-full"
      )}
      aria-label="Useful links"
    >
      {links.map((link) => {
        if (link.shouldRender === false) return null;
        return (
          <Button
            key={link.title}
            variant="ghost"
            onClick={link.action}
            aria-label={link.title}
            className="w-full justify-start"
          >
            <link.icon className="size-4" aria-hidden="true" />
            <span className="text-sm">{link.title}</span>
          </Button>
        );
      })}
    </nav>
  );
});
