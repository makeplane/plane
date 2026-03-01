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

import { EditIcon, TrashIcon, PlaneLogo } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { IProject } from "@plane/types";

type TProjectEntityItem = {
  project: IProject;
  handleEditOpen: () => void;
  handleDeleteOpen: () => void;
};

export function ProjectEntityItem(props: TProjectEntityItem) {
  const { project, handleEditOpen, handleDeleteOpen } = props;
  return (
    <div className="group relative bg-surface-1 border border-subtle rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
      {/* Status indicator strip */}
      <div className="absolute top-0 left-0 h-full w-1 bg-accent-primary/30 group-hover:bg-accent-primary transition-colors duration-300" />

      <div className="p-4 pl-5 relative w-full flex items-center">
        <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center transition-all duration-300 ease-in-out pr-0 md:group-hover:pr-[70px]">
          {/* Project Side */}
          <div className="flex w-full flex-1 min-w-0 items-center gap-2 bg-layer-1 py-2 px-3 rounded-lg border border-subtle shadow-sm transition-all duration-200 group-hover:border-subtle">
            <PlaneLogo className="h-5 w-auto shrink-0 relative text-primary" />
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div className="h-4 w-4 shrink-0 bg-surface-1 rounded-sm overflow-hidden flex items-center justify-center">
                {project?.logo_props ? (
                  <Logo logo={project?.logo_props} size={12} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-medium bg-accent-primary/10 rounded-sm text-caption-xs-regular">
                    {project?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                )}
              </div>
              <span className="text-body-xs-medium text-primary truncate">{project?.name || "Project"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 invisible transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:visible">
          <Button
            variant="secondary"
            className="h-7 w-7 rounded-md p-0 hover:bg-accent-primary/10 hover:text-accent-primary transition-colors"
            onClick={handleEditOpen}
          >
            <EditIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="secondary"
            className="h-7 w-7 rounded-md p-0 hover:bg-danger-subtle hover:text-danger-primary transition-colors"
            onClick={handleDeleteOpen}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
