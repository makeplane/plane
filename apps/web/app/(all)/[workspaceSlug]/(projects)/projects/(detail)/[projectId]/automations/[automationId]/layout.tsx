"use client";

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// plane web imports
import { AutomationsDetailsWrapper } from "@/plane-web/components/automations/details/wrapper";
import { AutomationsListWrapper } from "@/plane-web/components/automations/list/wrapper";
import { useFlag } from "@/plane-web/hooks/store";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
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
  // store hooks
  const {
    projectAutomations: { fetchAutomationDetails },
  } = useAutomations();
  // derived values
  const isProjectAutomationsEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.PROJECT_AUTOMATIONS);

  // fetching automation details
  useSWR(
    workspaceSlug && projectId && automationId && isProjectAutomationsEnabled
      ? ["automations", workspaceSlug, projectId, automationId, isProjectAutomationsEnabled]
      : null,
    () => fetchAutomationDetails(workspaceSlug, projectId, automationId)
  );

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <AutomationsDetailsWrapper automationId={automationId} projectId={projectId} workspaceSlug={workspaceSlug}>
        <AppHeader header={<ProjectAutomationDetailsHeader automationId={automationId} projectId={projectId} />} />
        <ContentWrapper className="overflow-hidden">{children}</ContentWrapper>
      </AutomationsDetailsWrapper>
    </AutomationsListWrapper>
  );
});

export default AutomationDetailsLayout;
