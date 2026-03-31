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

import { useCallback } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";
import type { IAutomationInstance } from "@/store/automations/automation";
// local imports
import { NoAutomationsEmptyState } from "../no-automations";
import { AutomationsTableLoader } from "./table/loader";
import { AutomationsTable } from "./table/root";

type TProps = {
  workspaceSlug: string;
};

export const WorkspaceAutomationsListRoot = observer(function WorkspaceAutomationsListRoot(props: TProps) {
  const { workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const {
    workspaceAutomations: {
      getWorkspaceAutomations,
      getIsInitializingAutomations,
      isAnyAutomationAvailableForWorkspace,
      setCreateUpdateModalConfig,
    },
  } = useAutomations();
  // derived values
  const automations = getWorkspaceAutomations(workspaceSlug);
  const isInitializingAutomations = getIsInitializingAutomations(workspaceSlug);

  // handlers
  const handleAutomationClick = useCallback(
    (automation: IAutomationInstance) => {
      router.push(automation.redirectionLink);
    },
    [router]
  );

  if (isInitializingAutomations) {
    return <AutomationsTableLoader />;
  }

  if (!isAnyAutomationAvailableForWorkspace(workspaceSlug)) {
    return (
      <NoAutomationsEmptyState onCreateClick={() => setCreateUpdateModalConfig({ isOpen: true, payload: null })} />
    );
  }

  return <AutomationsTable automations={automations} onAutomationClick={handleAutomationClick} />;
});
