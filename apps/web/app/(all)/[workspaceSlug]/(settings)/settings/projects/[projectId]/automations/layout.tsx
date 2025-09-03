"use client";

import { observer } from "mobx-react";
// plane web imports
import { AutomationsListWrapper } from "@/plane-web/components/automations/list/wrapper";

type Props = {
  params: {
    projectId: string;
    workspaceSlug: string;
  };
  children: React.ReactNode;
};

const AutomationsListLayout: React.FC<Props> = observer((props) => {
  const {
    params: { projectId: projectIdParam, workspaceSlug: workspaceSlugParam },
    children,
  } = props;
  const projectId = projectIdParam?.toString();
  const workspaceSlug = workspaceSlugParam?.toString();

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      {children}
    </AutomationsListWrapper>
  );
});

export default AutomationsListLayout;
