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

import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web imports
import { useFlag } from "@/plane-web/hooks/store";
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  workspaceSlug: string;
  children: React.ReactNode;
};

export const WorkspaceAutomationsWrapper = observer(function WorkspaceAutomationsListWrapper(props: Props) {
  const { workspaceSlug, children } = props;
  const {
    workspaceAutomations: { canView, fetchAutomations },
  } = useAutomations();
  // derived values
  const isWorkspaceAutomationsEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_AUTOMATIONS);

  // fetching automations list
  useSWR(
    workspaceSlug && isWorkspaceAutomationsEnabled && canView
      ? ["workspace-automations", workspaceSlug, isWorkspaceAutomationsEnabled, canView]
      : null,
    () => fetchAutomations(workspaceSlug)
  );

  return <>{children}</>;
});
