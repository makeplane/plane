"use client";

import { observer } from "mobx-react";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web imports
import { AutomationsDetailsWrapper } from "@/plane-web/components/automations/details/wrapper";
import { AutomationsListWrapper } from "@/plane-web/components/automations/list/wrapper";
// local imports
import { ProjectAutomationDetailsHeader } from "./header";

type Props = {
  params: {
    automationId: string;
    projectId: string;
    workspaceSlug: string;
  };
  children: React.ReactNode;
};

const AutomationDetailsLayout: React.FC<Props> = observer((props) => {
  const {
    params: { automationId: automationIdParam, projectId: projectIdParam, workspaceSlug: workspaceSlugParam },
    children,
  } = props;
  const automationId = automationIdParam?.toString();
  const projectId = projectIdParam?.toString();
  const workspaceSlug = workspaceSlugParam?.toString();

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <AutomationsDetailsWrapper automationId={automationId} projectId={projectId} workspaceSlug={workspaceSlug}>
        <AppHeader
          header={
            <ProjectAutomationDetailsHeader
              automationId={automationId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          }
        />
        <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
      </AutomationsDetailsWrapper>
    </AutomationsListWrapper>
  );
});

export default AutomationDetailsLayout;
