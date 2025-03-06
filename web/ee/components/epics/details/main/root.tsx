"use client";

import { observer } from "mobx-react";
// hooks
import { useAppTheme } from "@/hooks/store";
// local-components
import { MainWrapper } from "@/plane-web/components/common";
import { EpicCollapsibleSection } from "./collapsible-section-root";
import { EpicInfoSection } from "./info-section-root";
import { EpicOverviewRoot } from "./overview-section-root";
import { EpicProgressSection } from "./progress-section-root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicMainContentRoot: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const { epicDetailSidebarCollapsed } = useAppTheme();

  return (
    <MainWrapper isSidebarOpen={!epicDetailSidebarCollapsed}>
      <EpicInfoSection workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} disabled={disabled} />
      <EpicProgressSection epicId={epicId} />
      <EpicCollapsibleSection workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} disabled={disabled} />
      <EpicOverviewRoot workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} disabled={disabled} />
    </MainWrapper>
  );
});
