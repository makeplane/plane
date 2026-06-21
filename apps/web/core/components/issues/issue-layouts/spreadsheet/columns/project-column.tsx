/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  issue: TIssue;
};

export const SpreadsheetProjectColumn = observer(function SpreadsheetProjectColumn(props: Props) {
  const { issue } = props;
  const { getProjectById } = useProject();

  const project = getProjectById(issue.project_id);

  return (
    <div className="flex h-11 items-center gap-1.5 border-b-[0.5px] border-subtle px-page-x text-13">
      {project?.logo_props ? (
        <Logo logo={project.logo_props} size={14} />
      ) : (
        <ProjectIcon className="size-3.5 flex-shrink-0 text-tertiary" />
      )}
      <span className="truncate text-secondary">{project?.name ?? "Project"}</span>
    </div>
  );
});
