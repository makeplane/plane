"use client";

import { observer } from "mobx-react";
import { Outlet } from "react-router";
// plane web imports
import { AutomationsListWrapper } from "@/plane-web/components/automations/list/wrapper";
import type { Route } from "./+types/layout";

const AutomationsListLayout = observer((props: Route.ComponentProps) => {
  const {
    params: { projectId, workspaceSlug },
  } = props;

  return (
    <AutomationsListWrapper projectId={projectId} workspaceSlug={workspaceSlug}>
      <Outlet />
    </AutomationsListWrapper>
  );
});

export default AutomationsListLayout;
