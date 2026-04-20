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

// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { PermissionRole, TPartialProject } from "@plane/types";

type TProjectSettingsSwitcherButtonProps = {
  project: TPartialProject;
  roleDetails: PermissionRole | undefined;
};

export function ProjectSettingsSwitcherButton(props: TProjectSettingsSwitcherButtonProps) {
  const { project, roleDetails } = props;

  return (
    <Tooltip tooltipContent={project.name} position="bottom">
      <div className="flex items-center gap-2 w-full">
        <div className="shrink-0 size-8 grid place-items-center rounded">
          <Logo logo={project.logo_props} size={20} />
        </div>
        <div className="flex items-center justify-between w-full pr-2 truncate">
          <div className="flex flex-col items-start gap-1 text-left truncate">
            <p className="text-body-sm-medium truncate w-full">{project.name}</p>
            {roleDetails ? <p className="text-caption-md-regular text-tertiary">{roleDetails.name}</p> : null}
          </div>
          <ChevronDownIcon className="size-4 shrink-0 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Tooltip>
  );
}
