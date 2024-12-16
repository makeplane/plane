"use client";

import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// local-components
import { EpicDetailWidgetCollapsibles } from "../widgets/epic-detail-widgets/epic-detail-widget-collapsibles";
import { EpicOverviewRoot } from "../widgets/epic-overview-widgets";
import { EpicDetailsRoot } from "./details";
import { EpicProgressRoot } from "./progress";
import { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  isArchived: boolean;
};

export const EpicMainContentRoot: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, issueOperations, isEditable, isArchived } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();

  return (
    <div
      className={cn(`h-full w-full overflow-y-auto px-9 py-5`, {
        "max-w-2/3": !epicDetailSidebarCollapsed,
      })}
    >
      <EpicDetailsRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        epicId={epicId}
        issueOperations={issueOperations}
        isEditable={isEditable}
        isArchived={isArchived}
      />

      <EpicProgressRoot workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} />
      <EpicDetailWidgetCollapsibles
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        epicId={epicId}
        disabled={isArchived || !isEditable}
      />

      <EpicOverviewRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        epicId={epicId}
        disabled={isArchived || !isEditable}
      />
    </div>
  );
});
