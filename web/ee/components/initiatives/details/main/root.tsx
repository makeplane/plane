"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web
import { MainWrapper } from "@/plane-web/components/common";
// local components
import { InitiativeCollapsibleSection } from "./collapsible-section-root";
import { InitiativeInfoSection } from "./info-section-root";
import { InitiativeModalsRoot } from "./modals";
import { InitiativeProgressSection } from "./progress-section-root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const InitiativeMainContentRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const { initiativesSidebarCollapsed } = useAppTheme();

  return (
    <MainWrapper isSidebarOpen={!initiativesSidebarCollapsed}>
      <InitiativeInfoSection workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      <InitiativeProgressSection initiativeId={initiativeId} />
      <InitiativeCollapsibleSection workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      <InitiativeModalsRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
    </MainWrapper>
  );
});
