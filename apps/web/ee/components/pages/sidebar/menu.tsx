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
import { useParams, usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
// plane imports
import type { ISvgIcons } from "@plane/propel/icons";
import { HomeIcon } from "@plane/propel/icons";
// helpers
import { cn } from "@plane/utils";
// hooks

const SIDEBAR_MENU_ITEMS: {
  key: string;
  label: string;
  href: string;
  highlight: (pathname: string, baseUrl: string) => boolean;
  Icon: LucideIcon | React.FC<ISvgIcons>;
}[] = [
  {
    key: "home",
    label: "Home",
    href: `/wiki`,
    highlight: (pathname: string, baseUrl: string) => pathname === `${baseUrl}`,
    Icon: HomeIcon,
  },
];

export const PagesAppSidebarMenu = observer(function PagesAppSidebarMenu() {
  // params
  const { workspaceSlug } = useParams();
  const pathname = usePathname();

  return (
    <div className="w-full space-y-1">
      {SIDEBAR_MENU_ITEMS.map((link) => {
        return (
          <Link key={link.key} href={`/${workspaceSlug}${link.href}`} className="block">
            <div
              className={cn(
                "group flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-secondary outline-none hover:bg-layer-transparent-hover focus:bg-layer-transparent-active",
                {
                  "bg-layer-transparent-active text-primary hover:bg-layer-transparent-active focus:bg-layer-transparent-active":
                    link.highlight(pathname, `/${workspaceSlug}${link.href}/`),
                }
              )}
            >
              {<link.Icon className="size-4" />}
              <p className="text-13 leading-5 font-medium">{link.label}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
});
