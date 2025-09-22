"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { MainWrapper } from "@/plane-web/components/common/layout/main/main-wrapper";
// local components
import { InitiativeCollapsibleSection } from "./collapsible-section-root";
import { InitiativeInfoSection } from "./info-section-root";
import { InitiativeModalsRoot } from "./modals";
import { InitiativeProgressSection } from "./progress-section-root";
import { ScopeBreakdown } from "./scope-breakdown";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
  toggleEpicModal: (value?: boolean) => void;
  toggleProjectModal: (value?: boolean) => void;
};

export const InitiativeMainContentRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false, toggleEpicModal, toggleProjectModal } = props;
  // store hooks
  const { initiativesSidebarCollapsed } = useAppTheme();

  return (
    <MainWrapper isSidebarOpen={!initiativesSidebarCollapsed}>
      <InitiativeInfoSection
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={disabled}
        toggleProjectModal={toggleProjectModal}
        toggleEpicModal={toggleEpicModal}
      />
      <ScopeBreakdown
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        toggleProjectModal={toggleProjectModal}
        toggleEpicModal={toggleEpicModal}
        disabled={disabled}
      />
      <InitiativeProgressSection initiativeId={initiativeId} />
      <InitiativeCollapsibleSection
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={disabled}
        toggleEpicModal={toggleEpicModal}
        toggleProjectModal={toggleProjectModal}
      />
      <InitiativeModalsRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} />
    </MainWrapper>
  );
});
