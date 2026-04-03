/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPartialProject } from "@/plane-web/types";
// plane propel imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";

type TProjectHeaderButtonProps = {
  project: TPartialProject;
};

export function ProjectHeaderButton({ project }: TProjectHeaderButtonProps) {
  return (
    <Tooltip tooltipContent={project.name} position="bottom">
      <div className="relative flex w-full max-w-48 items-center pr-1 text-left select-none">
        <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-layer-1">
          <Logo logo={project.logo_props} size={16} />
        </div>
        <div className="relative min-w-0 flex-1 hover:rounded">
          <p className="truncate px-2 text-14 font-medium text-secondary">{project.name}</p>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 flex items-center justify-end opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="relative flex h-full w-8 items-center justify-end">
              <div className="absolute inset-0 rounded-r bg-gradient-to-r from-transparent to-surface-2" />
              <ChevronDownIcon className="relative z-10 size-4 text-tertiary" />
            </div>
          </div>
        </div>
      </div>
    </Tooltip>
  );
}
