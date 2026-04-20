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
import type { GroupSyncConfig } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { setPromiseToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
// hooks
import { useGroupSync } from "@/hooks/store/use-group-sync";

import { ConfigureGroupSync } from "./configure-group-sync";
import { GroupMapping } from "./group-mapping";

type GroupSyncingRootProps = { workspaceSlug: string };

export const GroupSyncingRoot = observer(function GroupSyncingRoot(props: GroupSyncingRootProps) {
  // props
  const { workspaceSlug } = props;
  // store hooks
  const {
    fetchGroupSyncConfigByWorkspaceSlug,
    fetchGroupMappingsByWorkspaceSlug,
    getGroupSyncConfigByWorkspaceSlug,
    updateGroupSyncConfigByWorkspaceSlug,
  } = useGroupSync();

  const { t } = useTranslation();
  // derived values
  const syncConfig = getGroupSyncConfigByWorkspaceSlug(workspaceSlug);
  const isEnabled = syncConfig?.is_enabled ?? false;

  useSWR(`GROUP_SYNCING_SETTINGS_${workspaceSlug}`, async () => {
    await fetchGroupSyncConfigByWorkspaceSlug(workspaceSlug);
    await fetchGroupMappingsByWorkspaceSlug(workspaceSlug);
  });

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && !Array.isArray(err)) {
      const messages = Object.values(err).flat();
      const first = messages.find((m): m is string => typeof m === "string");
      if (first) return first;
    }
    return t("workspace_settings.settings.group_syncing.toast.error");
  };

  const handleChange = async (payload: Partial<GroupSyncConfig>) => {
    const promise = updateGroupSyncConfigByWorkspaceSlug(workspaceSlug, payload);

    setPromiseToast(promise, {
      loading: t("workspace_settings.settings.group_syncing.toast.updating"),
      success: {
        title: t("toast.success"),
        message: () => t("workspace_settings.settings.group_syncing.toast.success"),
      },
      error: {
        title: t("toast.error"),
        message: (err) => getErrorMessage(err),
      },
    });

    await promise;
  };

  return (
    <div className="mt-6">
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.group_syncing.enable.title")}
        description={t("workspace_settings.settings.group_syncing.enable.description")}
        control={<Switch value={isEnabled} onChange={(value) => void handleChange({ is_enabled: value })} />}
      />

      <div className={cn({ "opacity-60 pointer-events-none select-none": !isEnabled })}>
        <ConfigureGroupSync workspaceSlug={workspaceSlug} syncConfig={syncConfig} handleChange={handleChange} />
        <GroupMapping workspaceSlug={workspaceSlug} disabled={!isEnabled} />
      </div>
    </div>
  );
});
