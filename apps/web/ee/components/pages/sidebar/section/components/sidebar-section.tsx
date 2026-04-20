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

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { CollapsibleContent } from "@plane/propel/collapsible";
import { cn } from "@plane/utils";

type SidebarSectionHeaderProps = {
  label: ReactNode;
  actions?: ReactNode;
} & ({ href: string } | { href?: undefined });

export function SidebarSectionHeader({ label, actions, href }: SidebarSectionHeaderProps) {
  const labelNode = href ? (
    <Link href={href} className="min-w-0 flex-grow truncate text-13 leading-5 font-semibold text-placeholder">
      {label}
    </Link>
  ) : (
    <span className="min-w-0 flex-1 truncate text-13 leading-5 font-semibold text-placeholder">{label}</span>
  );

  return (
    <div className="group ml-1 flex h-8 items-center justify-between gap-1 rounded-md px-1 text-secondary transition-colors hover:bg-layer-transparent-hover focus-within:bg-layer-transparent-active">
      {labelNode}
      <div className="flex shrink-0 items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {actions}
      </div>
    </div>
  );
}

export function SidebarSectionContent({ className, ...props }: ComponentProps<typeof CollapsibleContent>) {
  return <CollapsibleContent className={cn("ml-1 mt-1 pb-1 transition-none", className)} {...props} />;
}
