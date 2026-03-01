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

import type { TPartialProject } from "@/types";
import { ROLE_DETAILS } from "@plane/constants";
// plane propel imports
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";

type TProjectSettingsSwitcherButtonProps = {
  project: TPartialProject;
  currentProjectRole: keyof typeof ROLE_DETAILS | undefined;
};

export function ProjectSettingsSwitcherButton({ project, currentProjectRole }: TProjectSettingsSwitcherButtonProps) {
  const { t } = useTranslation();

  return (
    <Tooltip tooltipContent={project.name} position="bottom">
      <div className="flex items-center gap-2 w-full">
        <div className="shrink-0 size-8 grid place-items-center rounded">
          <Logo logo={project.logo_props} size={20} />
        </div>
        <div className="flex items-center justify-between w-full pr-2 truncate">
          <div className="flex flex-col items-start gap-1 text-left truncate">
            <p className="text-body-sm-medium truncate w-full">{project.name}</p>
            <p className="text-caption-md-regular text-tertiary">
              {currentProjectRole ? t(ROLE_DETAILS[currentProjectRole].i18n_title) : ""}
            </p>
          </div>
          <ChevronDownIcon className="size-4 shrink-0 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Tooltip>
  );
}
