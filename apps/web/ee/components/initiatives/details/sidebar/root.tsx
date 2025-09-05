"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// icons
import { Activity } from "lucide-react";
import { CommentFillIcon, InfoFillIcon } from "@plane/propel/icons";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { SidebarRoot } from "@/plane-web/components/common/layout/sidebar";
// local components
import { InitiativeSidebarActivityRoot } from "./activity-tab-root";
import { InitiativeSidebarCommentsRoot } from "./comment-tab-root";
import { InitiativeSidebarPropertiesRoot } from "./properties-tab-root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
  toggleEpicModal: (value?: boolean) => void;
  toggleProjectModal: (value?: boolean) => void;
};

export const InitiativeSidebarRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false, toggleEpicModal, toggleProjectModal } = props;
  // store hooks
  const { initiativesSidebarCollapsed } = useAppTheme();

  const INITIATIVE_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: (
        <InitiativeSidebarPropertiesRoot
          workspaceSlug={workspaceSlug}
          initiativeId={initiativeId}
          disabled={disabled}
          toggleEpicModal={toggleEpicModal}
          toggleProjectModal={toggleProjectModal}
        />
      ),
    },
    {
      key: "comments",
      icon: CommentFillIcon,
      content: (
        <InitiativeSidebarCommentsRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={disabled} />
      ),
    },
    {
      key: "activity",
      icon: Activity,
      content: <InitiativeSidebarActivityRoot initiativeId={initiativeId} />,
    },
  ];

  return (
    <SidebarRoot
      tabs={INITIATIVE_DETAILS_SIDEBAR_TABS}
      storageKey={`initiative-detail-sidebar-${initiativeId}`}
      defaultTab="properties"
      isSidebarOpen={!initiativesSidebarCollapsed}
    />
  );
});
