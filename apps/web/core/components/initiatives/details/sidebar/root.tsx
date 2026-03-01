/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { observer } from "mobx-react";
// icons
import { Activity } from "lucide-react";
import { CommentFillIcon, InfoFillIcon } from "@plane/propel/icons";
// hooks
import type { TInitiativeStates } from "@plane/types";
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { SidebarRoot } from "@/components/common/layout/sidebar";
// local components
import { InitiativeSidebarActivityRoot } from "./activity-tab-root";
import { InitiativeSidebarCommentsRoot } from "./comment-tab-root";
import { InitiativeSidebarPropertiesRoot } from "./properties-tab-root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
  handleInitiativeStateUpdate: (state: TInitiativeStates) => void;
  handleInitiativeLabelUpdate: (labelIds: string[]) => void;
};

export const InitiativeSidebarRoot = observer(function InitiativeSidebarRoot(props: Props) {
  const {
    workspaceSlug,
    initiativeId,
    disabled = false,
    handleInitiativeStateUpdate,
    handleInitiativeLabelUpdate,
  } = props;
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
          handleInitiativeStateUpdate={handleInitiativeStateUpdate}
          handleInitiativeLabelUpdate={handleInitiativeLabelUpdate}
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
