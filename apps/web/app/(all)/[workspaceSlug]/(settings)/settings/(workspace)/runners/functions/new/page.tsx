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
import { useRouter } from "next/navigation";
import { useParams } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane-web imports
import { CreateUpdateFunction } from "@/components/runners/form/create-update-function";
import { ScriptsWorkspaceSettingsHeader } from "../../header";

function NewFunctionPage() {
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const { workspaceSlug } = useParams();
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - New Function` : undefined;

  return (
    <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug as string}>
      <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
        <PageHead title={pageTitle} />
        <div className="w-full">
          <CreateUpdateFunction
            handleCancel={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
            callBack={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
          />
        </div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
}

export default observer(NewFunctionPage);
