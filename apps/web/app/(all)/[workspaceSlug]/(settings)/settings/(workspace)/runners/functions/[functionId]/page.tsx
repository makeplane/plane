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
import useSWR from "swr";
// ui
import { Loader } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useFunctions } from "@/hooks/store/runners/use-functions";
// components
import { CreateUpdateFunction } from "@/components/runners/form/create-update-function";
import { ScriptsWorkspaceSettingsHeader } from "../../header";

function EditFunctionPage() {
  const { currentWorkspace } = useWorkspace();
  const router = useRouter();
  const { workspaceSlug, functionId } = useParams();
  const { fetchFunctionById, getFunctionById } = useFunctions();

  // Fetch function data
  const { isLoading } = useSWR(
    workspaceSlug && functionId ? `FUNCTION_${workspaceSlug}_${functionId}` : null,
    workspaceSlug && functionId ? () => fetchFunctionById(workspaceSlug, functionId) : null
  );

  const functionData = functionId ? getFunctionById(functionId) : undefined;
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${functionData?.name || "Edit Function"}`
    : undefined;

  // Check if it's a system function (cannot be edited)
  if (functionData?.is_system) {
    return (
      <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug as string}>
        <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
          <PageHead title={pageTitle} />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-lg font-medium text-primary">System Function</h3>
            <p className="mt-2 text-sm text-secondary">System functions cannot be edited.</p>
            <button
              onClick={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
              className="mt-4 text-sm text-primary-dark hover:underline"
            >
              Back to Functions
            </button>
          </div>
        </SettingsContentWrapper>
      </WithFeatureFlagHOC>
    );
  }

  if (isLoading) {
    return (
      <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug as string}>
        <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
          <PageHead title={pageTitle} />
          <div className="w-full py-10">
            <Loader className="mx-auto w-full max-w-2xl space-y-4">
              <Loader.Item height="40px" />
              <Loader.Item height="100px" />
              <Loader.Item height="200px" />
            </Loader>
          </div>
        </SettingsContentWrapper>
      </WithFeatureFlagHOC>
    );
  }

  if (!functionData) {
    return (
      <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug as string}>
        <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
          <PageHead title={pageTitle} />
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h3 className="text-lg font-medium text-primary">Function Not Found</h3>
            <p className="mt-2 text-sm text-secondary">The function you are looking for does not exist.</p>
            <button
              onClick={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
              className="mt-4 text-sm text-primary-dark hover:underline"
            >
              Back to Functions
            </button>
          </div>
        </SettingsContentWrapper>
      </WithFeatureFlagHOC>
    );
  }

  return (
    <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug as string}>
      <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
        <PageHead title={pageTitle} />
        <div className="w-full">
          <CreateUpdateFunction
            functionData={functionData}
            handleCancel={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
            callBack={() => router.push(`/${workspaceSlug}/settings/runner?tab=functions`)}
          />
        </div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
}

export default observer(EditFunctionPage);
