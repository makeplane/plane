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

// components
import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
// local imports
import { WorkItemWithOverviewHeader } from "./with-overview";
import { WorkItemWithoutOverviewHeader } from "./without-overview";

type TProjectWorkItemsHeaderProps = {
  workspaceSlug: string;
};

export function ProjectWorkItemsHeader(props: TProjectWorkItemsHeaderProps) {
  const { workspaceSlug } = props;

  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug}
      flag="PROJECT_OVERVIEW"
      fallback={<WorkItemWithoutOverviewHeader />}
    >
      <WorkItemWithOverviewHeader />
    </WithFeatureFlagHOC>
  );
}
