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
import { useRouter } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane-web imports
import { CreateUpdateRunnerScript } from "@/components/runners/form/create-update-runner-script";
import { useRunners } from "@/hooks/store/runners/use-runners";
import { ScriptsWorkspaceSettingsHeader } from "../../header";
import type { Route } from "./+types/page";

const ScriptDetailPage = observer(function ScriptDetailPage({ params }: Route.ComponentProps) {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug, scriptId } = params;
  const router = useRouter();
  const { fetchScriptById, getScriptById } = useRunners();
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - New Runner Task` : undefined;
  // swr
  const { isLoading } = useSWR(
    workspaceSlug && scriptId ? `RUNNER_SCRIPT_DETAIL_${workspaceSlug}_${scriptId}` : null,
    workspaceSlug && scriptId ? () => fetchScriptById(workspaceSlug, scriptId) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // Read from store only after the detail fetch has completed so we have
  // the full script object (the list endpoint omits `code`).
  const script = !isLoading && scriptId ? getScriptById(scriptId) : undefined;
  return (
    <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={null} workspaceSlug={workspaceSlug}>
      <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
        <PageHead title={pageTitle} />
        <div className="w-full">
          <CreateUpdateRunnerScript
            isLoading={isLoading}
            scriptData={script}
            handleCancel={() => router.push(`/${workspaceSlug}/settings/runner/?tab=scripts`)}
          />
        </div>
      </SettingsContentWrapper>
    </WithFeatureFlagHOC>
  );
});

export default ScriptDetailPage;
