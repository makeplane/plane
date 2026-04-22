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

import React from "react";
import Link from "next/link";
// plane imports
import { cn } from "@plane/utils";
import type { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "@plane/propel/icons";

type Props = {
  appendContent?: React.ReactNode;
  isActive: boolean;
  label: string;
} & ({ as: "button"; onClick: () => void } | { as: "link"; href: string }) &
  (
    | {
        icon: LucideIcon | React.FC<ISvgIcons>;
      }
    | { iconNode: React.ReactElement }
  );

export function SettingsSidebarItem(props: Props) {
  const { appendContent, as, isActive, label } = props;
  // common class
  const className = cn(
    "flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg text-body-xs-medium text-secondary text-left transition-colors",
    {
      "bg-layer-transparent-selected text-primary": isActive,
      "hover:bg-layer-transparent-hover": !isActive,
    }
  );
  // common content
  const content = (
    <>
      <div className="flex items-center gap-2 truncate">
        {"icon" in props ? (
          <span className="shrink-0 size-4 grid place-items-center">{<props.icon className="size-3.5" />}</span>
        ) : (
          props.iconNode
        )}
        <span className="truncate">{label}</span>
      </div>
      <div className="shrink-0">{appendContent}</div>
    </>
  );

  if (as === "button") {
    return (
      <button type="button" className={className} onClick={props.onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link className={className} href={props.href}>
      {content}
    </Link>
  );
}
