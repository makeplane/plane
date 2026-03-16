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
// plane imports
import { UpgradeIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Switch } from "@plane/propel/switch";
import { cn } from "@plane/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// plane web imports
import { useFlag, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";

type Props = {
  disabled: boolean;
  workspaceSlug: string;
  projectId: string;
};

export const ParallelCycles = observer(function ParallelCycles(props: Props) {
  const { disabled, workspaceSlug, projectId } = props;
  // store hooks
  const { isProjectFeatureEnabled, toggleProjectFeatures } = useProjectAdvanced();
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  // derived values
  const isFeatureFlagEnabled = useFlag(workspaceSlug.toString(), "PARALLEL_CYCLES");
  const isParallelCyclesEnabled = isProjectFeatureEnabled(projectId.toString(), "is_parallel_cycles_enabled");

  const toggleParallelCycles = async (enabled: boolean) => {
    const promise = toggleProjectFeatures(workspaceSlug.toString(), projectId.toString(), {
      is_parallel_cycles_enabled: enabled,
    });

    setPromiseToast(promise, {
      loading: enabled ? "Enabling parallel cycles" : "Disabling parallel cycles",
      success: {
        title: "Success",
        message: () => (enabled ? "Parallel cycles enabled." : "Parallel cycles disabled."),
      },
      error: {
        title: "Error",
        message: () => "Failed to update parallel cycles setting. Please try again.",
      },
    });
  };

  return (
    <div
      className={cn({
        "opacity-60 pointer-events-none select-none": disabled && isFeatureFlagEnabled,
      })}
    >
      <SettingsBoxedControlItem
        title="Parallel cycles"
        description="Run multiple cycles simultaneously to manage overlapping work streams."
        control={
          isFeatureFlagEnabled ? (
            <Switch value={isParallelCyclesEnabled} onChange={toggleParallelCycles} />
          ) : (
            <Button
              variant="secondary"
              size="lg"
              prependIcon={<UpgradeIcon />}
              onClick={() => togglePaidPlanModal(true)}
            >
              Upgrade
            </Button>
          )
        }
      />
    </div>
  );
});
