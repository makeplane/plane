/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import { Logo } from "@plane/blocks/emoji-icon-picker";
import { ProjectsOutline } from "@makeplane/propel/icons";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Badge } from "@makeplane/propel/components/badge";
// plane web hooks
import { useProject } from "@/hooks/store/use-project";

type Props = {
  project: {
    id: string;
    completed_issues?: number;
    total_issues?: number;
  };
  isLoading?: boolean;
};

function CompletionPercentage({ percentage }: { percentage: number }) {
  return <Badge variant={percentage > 50 ? "success" : "danger"} size="sm" label={`${percentage}%`} />;
}

function ActiveProjectItem(props: Props) {
  const { project } = props;
  const { getProjectById } = useProject();
  const { id, completed_issues, total_issues } = project;

  const projectDetails = getProjectById(id);

  if (!projectDetails) return null;

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-layer-1">
          <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
            {projectDetails?.logo_props ? (
              <Logo logo={projectDetails?.logo_props} size={16} />
            ) : (
              <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                <ProjectsOutline className="h-4 w-4" />
              </span>
            )}
          </span>
        </div>
        <Tooltip label={projectDetails?.name} layout="stacked" align="start">
          <p className="truncate text-body-xs-medium">{projectDetails?.name}</p>
        </Tooltip>
      </div>
      <CompletionPercentage
        percentage={completed_issues && total_issues ? Math.round((completed_issues / total_issues) * 100) : 0}
      />
    </div>
  );
}

export default ActiveProjectItem;
