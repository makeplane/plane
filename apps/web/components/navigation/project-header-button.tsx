/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TPartialProject } from "@plane/types";
// plane propel imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { Tooltip } from "@makeplane/propel/components/tooltip";

type TProjectHeaderButtonProps = {
  project: TPartialProject;
};

export function ProjectHeaderButton({ project }: TProjectHeaderButtonProps) {
  return (
    <Tooltip label={project.name} layout="stacked" side="bottom">
      <div className="relative flex w-full max-w-48 items-center pr-1 text-left select-none">
        <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-layer-1">
          <Logo logo={project.logo_props} size={16} />
        </div>
        {/* No chevron here: the enclosing `Select.Trigger` (`select-ghost-*`) already draws one, and two on
            the same trigger read as a duplicate. */}
        <div className="relative min-w-0 flex-1 hover:rounded">
          <p className="truncate px-2 text-14 font-medium text-secondary">{project.name}</p>
        </div>
      </div>
    </Tooltip>
  );
}
