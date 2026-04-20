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

import { redirect } from "react-router";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { GroupSyncingRoot } from "@/components/group-syncing/root";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// store
import { store } from "@/lib/store-context";
// local imports
import { GroupSyncingWorkspaceSettingsHeader } from "./header";

import type { Route } from "./+types/page";

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { workspaceSlug } = params;

  try {
    const isGroupSyncEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, "IDP_GROUP_SYNC", false);

    if (!isGroupSyncEnabled) {
      throw redirect(`/${workspaceSlug}/settings/`);
    }

    return { error: false, workspaceSlug };
  } catch (error) {
    // If it's a redirect, rethrow it
    if (error instanceof Response) {
      throw error;
    }
    // Otherwise return error state
    return { error: true, workspaceSlug };
  }
}

const GroupSyncingSettingsPage = observer(function GroupSyncingSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Group syncing` : undefined;

  return (
    <SettingsContentWrapper header={<GroupSyncingWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.group_syncing.heading")}
        description={t("workspace_settings.settings.group_syncing.description")}
      />

      <GroupSyncingRoot workspaceSlug={workspaceSlug} />
    </SettingsContentWrapper>
  );
});

export default GroupSyncingSettingsPage;
