/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { LucideIcon } from "lucide-react";
// plane imports
import type { TLogoProps } from "@plane/types";
import { CycleIcon, FavoriteFolderIcon, ModuleIcon, PageIcon, ProjectIcon, ViewsIcon } from "@plane/propel/icons";
import type { ISvgIcons } from "@plane/propel/icons";
import { Logo } from "@plane/propel/emoji-icon-picker";

const ICON_MAP: Record<string, React.FC<ISvgIcons> | LucideIcon> = {
  page: PageIcon,
  project: ProjectIcon,
  view: ViewsIcon,
  module: ModuleIcon,
  cycle: CycleIcon,
  folder: FavoriteFolderIcon,
};

type Props = {
  type: string;
  logo?: TLogoProps;
};

export const FavoriteItemIcon = ({ type, logo }: Props) => {
  const Icon = ICON_MAP[type] ?? PageIcon;

  return (
    <>
      <div className="hidden size-5 items-center justify-center group-hover:flex">
        <Icon className="m-auto size-4 flex-shrink-0 stroke-[1.5]" />
      </div>
      <div className="flex size-5 items-center justify-center group-hover:hidden">
        {logo?.in_use ? (
          <Logo logo={logo} size={16} type={type === "project" ? "material" : "lucide"} />
        ) : (
          <Icon className="m-auto size-4 flex-shrink-0 stroke-[1.5]" />
        )}
      </div>
    </>
  );
};
