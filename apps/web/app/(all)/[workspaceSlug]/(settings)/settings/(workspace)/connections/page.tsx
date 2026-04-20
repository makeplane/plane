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
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// plane web imports
import { ConnectionsProfileSettingsView } from "@/components/profile/connections-settings-view";
// local imports
import type { Route } from "./+types/page";
import { ConnectionsWorkspaceSettingsHeader } from "./header";

function ConnectionsSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  // translation
  const { t } = useTranslation();
  // derived values
  const currentWorkspace = getWorkspaceBySlug(workspaceSlug);
  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Connections` : undefined;

  if (!currentWorkspace?.id) return null;

  return (
    <SettingsContentWrapper header={<ConnectionsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("account_settings.connections.heading")}
        description={t("account_settings.connections.description")}
      />
      <ConnectionsProfileSettingsView />
    </SettingsContentWrapper>
  );
}

export default observer(ConnectionsSettingsPage);
